# CHECKPOINT — Acotación Jerárquica por Serie

**Fecha:** 26/05/2026
**Proyecto:** Valoración de Puestos MSC — Municipalidad de San Carlos
**Contexto completo para retomar el trabajo al día siguiente**

---

## 1. ¿QUÉ ES ESTE PROYECTO?

Sistema de valoración de puestos de la **Municipalidad de San Carlos (MSC)**. Evalúa puestos usando 6 factores:

| Factor | Pts máx |
|--------|---------|
| Dificultad de Funciones | 200 |
| Supervisión Ejercida | 150 |
| Responsabilidad | 200 |
| Condiciones de Trabajo | 100 |
| Consecuencia del Error | 150 |
| Requisitos | 200 |
| **Total** | **1000** |

Clasifica los puestos en una **Clase Municipal** (ej. `Operativo Municipal 6`, `Profesional Jefe 5`) dentro de 6 **Series Laborales** con jerarquía definida.

**Problema que resuelve la acotación jerárquica:** Evitar que un puesto de serie inferior (ej. *Peón* → Operativa) sea clasificado erróneamente en una categoría superior (Profesional o Jefatura) aunque los puntos calculados superen los umbrales de su serie.

---

## 2. SERIES LABORALES Y TOPES

| Serie | Máx puntos | Clase tope |
|-------|-----------|------------|
| Operativa | 355 | Operativo Municipal 6 |
| Administrativa | 355 | Administrativo Municipal 4 |
| Policia | 345 | Policia Municipal 5 |
| Tecnica | 390 | Tecnico Municipal 3 |
| Profesional | 610 | Profesional Municipal 4 |
| Jefatura | 880 | Profesional Jefe 5 |

Jerarquía (menor→mayor): `Operativa → Administrativa → Policia → Tecnica → Profesional → Jefatura`

---

## 3. ARCHIVOS DEL PROYECTO

| Ruta | Rol |
|------|-----|
| `frontend/src/constants/categorias.ts` | Frontend: clases, series, lógica de capping |
| `frontend/src/pages/WizardEvaluacion.tsx` | Frontend: wizard de evaluación con alerta visual |
| `server/src/services/reportGenerator.ts` | Backend: genera PDF con misma lógica de capping |
| `server/src/services/aiAgentService.ts` | Backend: llama a Gemini API con prompt enriquecido |
| `server/src/services/contextualAnalyzer.ts` | Backend: evaluador por reglas de respaldo + alertas |
| `server/.env` | Contiene `GEMINI_API_KEY` |

---

## 4. LO QUE YA SE IMPLEMENTÓ

### 4.1 `categorias.ts` — Clasificador determinista por nombre

**`determinarSeriePorNombre(nombre: string): string`** — Detecta la serie natural del puesto mediante palabras clave en orden de prioridad:

1. `director|gerente|subdirector|jefe|jefatura|coordinador|encargado` → **Jefatura**
2. `profesional|ingeniero|abogado|arquitecto|medico|psicologo|trabajador social|auditor|licenciado|analista` → **Profesional**
3. `tecnico|técnico|dibujante|soporte|inspector` → **Tecnica**
4. `policia|policía|seguridad|vigilante|guardia|transito|tránsito` → **Policia**
5. `auxiliar|asistente|secretaria|recepcionista|archivista|oficinista|cajero|administrativo` → **Administrativa**
6. `operario|peon|peón|conserje|chofer|mensajero|limpieza|mantenimiento|jardinero|cocinero|miscelaneo|miscelánea` → **Operativa**
7. Default → `Operativa` (conservador)

**`getEstratoSugerido(puntos, nombrePuesto?)`** — Filtra clases candidatas por jerarquía de serie:
```typescript
const ordenSeries = ['Operativa', 'Administrativa', 'Policia', 'Tecnica', 'Profesional', 'Jefatura'];
```

### 4.2 `WizardEvaluacion.tsx` — Alerta visual de acotación

- Llamada a `getEstratoCompleto` ahora pasa `puestoDetails?.nombre`
- Nuevo bloque de alerta azul cuando `totalPuntos > estrato.clase.puntos`:
  > "Acotación Jerárquica Activa: Por la naturaleza organizativa del puesto ({serie}), la clase de valoración se ha acotado automáticamente al estrato máximo permitido..."

### 4.3 `reportGenerator.ts` — PDF alineado

- Misma función `determinarSeriePorNombre`
- `getClaseSugerida(puntos, nombrePuesto?)` con filtro por jerarquía
- Llamada en `addConclusionHero` actualizada para pasar `evaluacion.puesto?.nombre`

### 4.4 `aiAgentService.ts` — Prompt de Gemini enriquecido

- `determinarSeriePorNombre` para identificar la serie del puesto
- `limitePuntosText` calculado según la serie (ej. Operativa → "MÁXIMO 355 PUNTOS")
- Bloque `=== CONTEXTO DE SERIE Y ACOTACIÓN JERÁRQUICA ===` en el prompt
- Tabla de `gradeTable` con puntajes físicos reales (Grado 1 ya no es 0 pts)
  - Ej: Dificultad G1=40pts, G2=80pts, G3=120pts, G4=160pts, G5=200pts

### 4.5 `contextualAnalyzer.ts` — Evaluador por reglas con alerta

- Misma `determinarSeriePorNombre`
- `contextualEvaluate` genera `alerta_global` si `total > maxPuntosPermitidos`
- Verbos añadidos: `colaborar`, `prestar`, `participar`
- `extraerAcciones` reconstruida con regex simplificado

---

## 5. LO QUE QUEDA PENDIENTE

### Diagnóstico de no-determinismo de Gemini

**Problema detectado:** En dos ejecuciones con el mismo puesto, el factor **Responsabilidad** varió entre Grado 5 (200 pts) y Grado 4 (160 pts), cambiando el total de 720 → 680 pts.

**Causa raíz:** `temperature > 0` en Gemini hace que cada llamada pueda elegir entre grados limítrofes con probabilidad similar.

### 3 scripts de prueba en `/tmp/`

| Script | Propósito | Llamadas |
|--------|-----------|----------|
| `test-determinismo-base.ts` | Línea base: 5 llamadas con config actual | 5 |
| `test-determinismo-temp0.ts` | 5 llamadas con `temperature: 0` | 5 |
| `test-determinismo-ensemble.ts` | 3 rondas de 3 llamadas + moda | 9 |

**Cómo ejecutar (desde `server/`):**
```bash
# 1. Línea base
cp /tmp/test-determinismo-base.ts .
npx tsx test-determinismo-base.ts <ID_DEL_PUESTO>
rm test-determinismo-base.ts

# 2. Temperature = 0
cp /tmp/test-determinismo-temp0.ts .
npx tsx test-determinismo-temp0.ts <ID_DEL_PUESTO>
rm test-determinismo-temp0.ts

# 3. Ensemble
cp /tmp/test-determinismo-ensemble.ts .
npx tsx test-determinismo-ensemble.ts <ID_DEL_PUESTO>
rm test-determinismo-ensemble.ts
```

**Criterio de decisión:**
- Si `temperature: 0` da 100% consistencia → implementar esa solución (mínimo cambio)
- Si no, evaluar ensemble o combinación temp=0 + reglas post-fix

---

## 6. NOTAS CLAVE

1. **No se modificó ningún archivo de producción** más allá de los 5 listados.
2. **Los scripts de prueba** no tocan el proyecto — se crean en `/tmp`, se copian temporalmente, se borran.
3. **Comando de desarrollo:** `npm run dev` en `server/` (nodemon + ts-node).
4. **Archivo .env** en `server/.env` — contiene `GEMINI_API_KEY`, `DATABASE_URL`.
5. **Plan original del Orquestador:** en `brain/` (fuera del repo).
6. **Últimos commits relevantes:**
   - `89da0e9` — Enhance PDF/HTML reports
   - `1542522` — Implementar acotación jerárquica por serie
   - `9d3a163` — Alinear escala del prompt Gemini y reconstruir extraerAcciones
