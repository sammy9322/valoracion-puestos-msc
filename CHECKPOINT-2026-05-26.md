# Checkpoint de Desarrollo: 26 de Mayo de 2026

**Proyecto:** Valoración de Puestos MSC — Municipalidad de San Carlos  
**Repositorio:** `github.com/sammy9322/valoracion-puestos-msc`  
**Build actual:** `v13-ensemble-temp0` (commit `43a19c7`)  
**Próxima sesión:** 27 de Mayo de 2026

---

## 1. RESUMEN DE HOY (26/05/2026)

### Lo que se logró
- **Acotación Jerárquica por Serie Laboral:** Implementada en 5 archivos clave. Evita que puestos de series inferiores reciban clasificaciones superiores a su tope.
- **Diagnóstico de Determinismo de Gemini:** Se ejecutaron pruebas con `temperature=1` (0% consistente) y `temperature=0` (80% consistente). El ensemble de 3 calls no se pudo probar por agotamiento del free tier.
- **Solución Implementada:** Ensemble de 3 llamadas con moda (`v13-ensemble-temp0`) + fallback a raw SQL para columnas faltantes en producción.

### Problemas identificados
1. La IA (Gemini) hace un trabajo que debería ser determinista (reglas de negocio).
2. Free tier de Gemini (20 req/día) es insuficiente — solo ~6 evaluaciones/día con ensemble.
3. La DB de producción está desincronizada con el schema de Prisma (faltan columnas).
4. `determinarSeriePorNombre` usa regex frágil en vez del campo `estrato` que ya existe en Supabase.
5. `pointsMap` duplicado en 3 archivos distintos.
6. Scripts de prueba en `/tmp` se perderán al reiniciar.

---

## 2. PLAN DE ACCIÓN PARA MAÑANA (27/05/2026)

### Fase 1 — Estabilización de Producción (30 min)

#### Tarea 1.1: Migrar DB de producción con `prisma db push`

**Problema:** Las columnas `analisis_multifuente` y `alerta_global` no existen en la DB de Neon. El sistema usa un fallback a raw SQL que silencia el error pero no guarda esos datos.

**Pasos:**
1. Obtener el `DATABASE_URL` de producción desde Vercel:
   ```bash
   cd server
   vercel env pull .env.production --environment=production
   ```
   Si las vars están encriptadas y vienen vacías (como se documentó), alternativas:
   - Ir al dashboard de Vercel > Settings > Environment Variables > copiar `DATABASE_URL` manualmente
   - O ejecutar `prisma db push` desde un deploy temporal en Vercel (mismo patrón que se usó para las pruebas de determinismo)

2. Ejecutar la migración:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push --accept-data-loss
   ```

3. Verificar que las columnas existen:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db pull
   ```

4. Una vez confirmado, **eliminar la función `saveEvaluacion()` con fallback raw SQL** de `evaluaciones.ts` y volver a usar `prisma.evaluacion.create()` directamente.

**Criterio de éxito:** `prisma.evaluacion.create()` funciona sin fallback en producción.

---

#### Tarea 1.2: Mover scripts de `/tmp` al repositorio

**Archivos a mover:**
```
/tmp/test-determinismo-base.ts     → server/scripts/test-determinismo-base.ts
/tmp/test-determinismo-temp0.ts    → server/scripts/test-determinismo-temp0.ts
/tmp/test-determinismo-ensemble.ts → server/scripts/test-determinismo-ensemble.ts
```

**Pasos:**
```bash
mkdir -p server/scripts
cp /tmp/test-determinismo-*.ts server/scripts/
git add server/scripts/
git commit -m "chore: mover scripts de pruebas de determinismo al repositorio"
```

**Criterio de éxito:** Scripts versionados y persistentes.

---

### Fase 2 — Consolidación del Código (1 hora)

#### Tarea 2.1: Unificar `pointsMap` en un archivo compartido

**Problema:** `pointsMap` está definido en 3 lugares:
- `frontend/src/pages/WizardEvaluacion.tsx` (líneas 22-29)
- `server/src/routes/evaluaciones.ts` (líneas 23-30)
- `server/src/services/aiAgentService.ts` (implícito en el prompt)

Si cambia un peso, hay que actualizar 3 archivos. Esto es un riesgo real para un sistema de valoración salarial legal.

**Solución:**
1. Crear `shared/constants/pointsMap.ts`:
   ```typescript
   export const POINTS_MAP: Record<string, number[]> = {
     dificultad:      [0, 40, 80, 120, 160, 200],
     supervision:     [0, 30, 60, 90, 120, 150],
     responsabilidad: [0, 40, 80, 120, 160, 200],
     condiciones:     [0, 20, 40, 60, 80, 100],
     error:           [0, 30, 60, 90, 120, 150],
     requisitos:      [0, 40, 80, 120, 160, 200]
   };

   export const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'] as const;
   export type Factor = typeof FACTORS[number];

   export const MAX_POINTS = 1000; // Suma de todos los grados 5
   ```

2. Importar desde los 3 archivos que lo usan.
3. Eliminar las definiciones duplicadas.

**Nota:** Si la estructura monorepo no permite imports cruzados entre `frontend/` y `server/`, duplicar en dos archivos pero con un comentario `// SOURCE OF TRUTH: shared/constants/pointsMap.ts` y un test que verifique que ambos son idénticos.

**Criterio de éxito:** Un solo lugar donde cambiar los pesos de los factores.

---

#### Tarea 2.2: Renombrar `callOllama` → `callGeminiEnsemble`

**Problema:** La función principal del motor IA se sigue llamando `callOllama` pero llama a Gemini. Esto confunde a cualquier developer nuevo.

**Archivo:** `server/src/services/aiAgentService.ts`

**Cambios:**
- `callOllama` → `callGeminiEnsemble`
- Actualizar todas las referencias en `evaluaciones.ts` y cualquier otro archivo que la invoque.
- Actualizar comentarios y logs.

**Criterio de éxito:** Grep de `ollama` en el proyecto devuelve 0 resultados (excepto en documentación histórica).

---

### Fase 3 — Clasificación Confiable de Series (1 hora)

#### Tarea 3.1: Usar campo `estrato` de Supabase en vez de regex

**Problema:** `determinarSeriePorNombre(nombre)` intenta adivinar la serie laboral del puesto analizando palabras clave en su nombre. Esto falla con puestos ambiguos como "Encargado del Acueducto" (¿Técnico o Profesional?).

**Dato clave:** La tabla `CatalogoPuesto` en el schema de Prisma ya tiene un campo `estrato` (string). Y la vista `v_catalogo_puestos` de Supabase probablemente también lo expone.

**Solución:**
1. En el endpoint `GET /api/puestos/:id`, incluir el campo `estrato` en la respuesta (si no se incluye ya).
2. En `WizardEvaluacion.tsx`, al seleccionar un puesto, leer `selectedPuestoDetails.estrato` o `selectedPuestoDetails.clase` directamente.
3. Pasar esa serie real a `getEstratoSugerido(puntos, serie)` en vez de inferirla por nombre.
4. Mantener `determinarSeriePorNombre` como **fallback** solo para puestos nuevos que no tienen estrato asignado en Supabase.

**Archivos a modificar:**
- `frontend/src/constants/categorias.ts` — Modificar `getEstratoSugerido` para aceptar un parámetro `serie` opcional con mayor prioridad que el regex.
- `frontend/src/pages/WizardEvaluacion.tsx` — Pasar la serie desde los detalles del puesto.
- `server/src/services/aiAgentService.ts` — Inyectar la serie real en el prompt de Gemini.
- `server/src/services/reportGenerator.ts` — Usar serie real para el PDF.
- `server/src/services/contextualAnalyzer.ts` — Usar serie real para alertas.

**Criterio de éxito:** Un puesto cuyo `estrato` en Supabase dice "Técnica" nunca es clasificado como "Operativa", independientemente de su nombre.

---

### Fase 4 — Invertir la Pirámide: Reglas > IA (2-3 horas)

#### Tarea 4.1: Fortalecer `contextualAnalyzer.ts` como motor principal

**Concepto:** El `contextualAnalyzer.ts` ya existe y evalúa por reglas heurísticas. Hoy es secundario. Mañana debe ser el motor primario.

**Reglas deterministas a implementar:**

| Factor | Señal en los datos | Grado asignado |
|---|---|---|
| **Requisitos** | "educación básica", "primaria" | G1 (40 pts) |
| **Requisitos** | "bachillerato", "secundaria" | G2 (80 pts) |
| **Requisitos** | "diplomado", "técnico superior" | G3 (120 pts) |
| **Requisitos** | "licenciatura", "bachillerato universitario" | G4 (160 pts) |
| **Requisitos** | "maestría", "especialización" | G5 (200 pts) |
| **Supervisión** | "no ejerce supervisión", sin `supervisa_a` | G1 (30 pts) |
| **Supervisión** | `supervisa_a` con 1-3 personas | G2 (60 pts) |
| **Supervisión** | Palabra "jefe" o "director" en nombre | G4-G5 |
| **Condiciones** | "oficina", sin mención de riesgos | G1 (20 pts) |
| **Condiciones** | "campo", "intemperie", "químicos" | G3-G4 |

**Arquitectura propuesta:**
```
Evaluación solicitada
       │
       ▼
┌─────────────────────┐
│ contextualAnalyzer   │  ← Motor principal (determinista, 100% consistente)
│ Reglas por factor    │
│ Basado en datos de   │
│ Supabase + ficha     │
└────────┬────────────┘
         │
         ▼
   ¿Tiene factores       Sí → Evaluar solo esos factores con Gemini
    ambiguos (sin         No → Resultado final listo (0 calls a la API)
    señal clara)?
         │
         ▼
┌─────────────────────┐
│ Gemini (ensemble)    │  ← Motor secundario (solo para ambigüedades)
│ Solo factores sin    │
│ señal determinista   │
└────────┬────────────┘
         │
         ▼
   Merge: Reglas + IA
   Resultado final
```

**Beneficio esperado:**
- La mayoría de puestos (estimado 70-80%) se evalúan **sin tocar Gemini** → 0 latencia, 0 costo, 100% determinista.
- Los puestos ambiguos usan Gemini solo para 1-3 factores, no los 6 → menos tokens, respuestas más focalizadas.
- El free tier de 20 req/día ahora alcanza para ~20-60 evaluaciones en vez de ~6.

---

#### Tarea 4.2: Degradar Gemini a "segundo opinador" en la UI

**Cambio en `WizardEvaluacion.tsx`:**
- Al seleccionar un puesto, ejecutar automáticamente el `contextualAnalyzer` y pre-llenar los grados.
- El botón "Generar Sugerencia IA" pasa de ser el método principal a ser un botón de **"Solicitar Segunda Opinión (IA)"**.
- Si la IA discrepa del motor de reglas en algún factor, mostrar un badge comparativo:
  > "Reglas: G2 (80 pts) | IA: G3 (120 pts) — Revise manualmente"

**Criterio de éxito:** Un evaluador puede completar el 100% del wizard sin hacer una sola llamada a Gemini.

---

## 3. ARCHIVOS CLAVE DEL PROYECTO (Referencia Rápida)

| Archivo | Función |
|---|---|
| `frontend/src/constants/categorias.ts` | Clases municipales, series, capping, `determinarSeriePorNombre` |
| `frontend/src/pages/WizardEvaluacion.tsx` | Wizard de evaluación (6 pasos + panel lateral + botón IA) |
| `server/src/services/aiAgentService.ts` | Motor Gemini (ensemble 3 calls, temperature=0) |
| `server/src/services/contextualAnalyzer.ts` | Evaluador por reglas heurísticas |
| `server/src/services/reportGenerator.ts` | Generador de reportes PDF/HTML |
| `server/src/routes/evaluaciones.ts` | API routes: POST /, POST /suggest, POST /ai-evaluate, GET / |
| `server/prisma/schema.prisma` | Schema de datos (PostgreSQL Neon) |
| `server/.env` | Variables de entorno (GEMINI_API_KEY, DATABASE_URL) |

---

## 4. VARIABLES DE ENTORNO Y ACCESOS

| Variable | Ubicación | Estado |
|---|---|---|
| `GEMINI_API_KEY` | Vercel (encrypted) | Funcional, pero free tier (20 req/día) |
| `DATABASE_URL` | Vercel (encrypted) | No accesible localmente, funcional en producción |
| `VITE_SUPABASE_URL` | `.env` local + Vercel | Funcional |
| `VITE_SUPABASE_ANON_KEY` | `.env` local + Vercel | Funcional |

---

## 5. ORDEN DE EJECUCIÓN MAÑANA

| # | Fase | Tarea | Tiempo est. | Dependencia |
|---|---|---|---|---|
| 1 | Estabilización | 1.1 Migrar DB producción | 15 min | Ninguna |
| 2 | Estabilización | 1.2 Mover scripts de /tmp | 5 min | Ninguna |
| 3 | Consolidación | 2.1 Unificar pointsMap | 30 min | Ninguna |
| 4 | Consolidación | 2.2 Renombrar callOllama | 15 min | Después de 2.1 |
| 5 | Clasificación | 3.1 Usar estrato de Supabase | 45 min | Después de 2.1 |
| 6 | Motor de Reglas | 4.1 Fortalecer contextualAnalyzer | 2 hrs | Después de 2.1 y 3.1 |
| 7 | UI | 4.2 Degradar IA a segundo opinador | 1 hr | Después de 4.1 |
|   | **TOTAL** | | **~5 horas** | |

---

## 6. LECCIONES DE ESTA SESIÓN

1. **Gemini 2.5 Flash no es determinista ni a temperature=0** — 1 outlier en 5 calls. El ensemble mitiga pero no elimina.
2. **Free tier (20 req/día) es insuficiente** — Con ensemble de 3 calls = ~6 evaluaciones/día para 124+ puestos.
3. **La IA no debería ser el motor principal** para decisiones que son reglas de negocio deterministas.
4. **Vercel env vars encriptadas** no se pueden descargar localmente. Solo se acceden en runtime de producción.
5. **Prisma genera client contra el schema, no contra la DB real** — Siempre correr `prisma db push` después de cambios al schema.

---

*Checkpoint generado el 26 de Mayo de 2026 a las 16:54 CST.*
*Para retomar: leer este archivo y comenzar por la Fase 1.*
