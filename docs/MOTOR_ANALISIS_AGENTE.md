# Motor de Análisis del Agente IA — Valoración de Puestos MSC

## Arquitectura General

El sistema de valoración utiliza un **pipeline de auditoría** de 4 etapas que transforma la descripción
de un puesto en un reporte de valoración objetivo y trazable.

```
Descripción del Puesto
        │
        ▼
┌──────────────────────┐
│ 1. Recopilación Docs  │  ← Enriquecimiento contextual (procedimientos)
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. LLM DeepSeek-Coder│  ← Evaluación contra rúbrica MSC
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 3. Validación Zod     │  ← Garantiza estructura y tipos
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. Guardrails         │  ← Detecta incertidumbre e inconsistencias
└──────────┬───────────┘
           │
           ▼
   Reporte de Auditoría
```

## Etapa 1: Recopilación de Documentación

**Archivo:** `server/src/services/valuationPipeline.ts`

Se recolecta toda la información disponible del puesto:

| Fuente | Descripción |
|--------|-------------|
| Descripción de funciones | Texto oficial del puesto |
| Requisitos | Nivel académico y experiencia |
| Procedimientos asociados | Enriquecimiento contextual vía `enrichProc` |

El contexto enriquecido se pasa al LLM para que la evaluación considere no solo
la descripción del puesto sino también los procedimientos operativos del área.

## Etapa 2: Llamada al LLM (DeepSeek-Coder)

**Archivo:** `server/src/services/aiAgentService.ts`

El agente LLM recibe un prompt estructurado con:

- La descripción de funciones del puesto
- La rúbrica MSC con los 6 factores y sus 5 grados
- Los procedimientos asociados (si existen)

Para cada factor, el LLM debe devolver:

| Factor | Clave | Grados (1–5) |
|--------|-------|--------------|
| Dificultad de Funciones | `dificultad` | Simple → Estratégica |
| Supervisión Ejercida | `supervision` | Ninguna → Dirección |
| Responsabilidad | `responsabilidad` | Baja → Proceso clave |
| Condiciones de Trabajo | `condiciones` | Oficina → Alta peligrosidad |
| Consecuencia del Error | `error` | Corregible → Estabilidad |
| Requisitos | `requisitos` | Básica → Maestría |

cada grado incluye una **justificación textual** de por qué se asignó ese nivel,
citando evidencia concreta de la descripción del puesto.

## Etapa 3: Validación Zod

**Archivo:** `server/src/services/outputValidator.ts`

La respuesta del LLM se valida contra un esquema estricto:

```typescript
const ValuationReportSchema = z.object({
  puesto_id: z.string(),
  totalPuntos: z.number(),
  evaluacion: z.object({
    dificultad: z.number().min(1).max(5),
    dificultad_just: z.string().min(10),
    supervision: z.number().min(1).max(5),
    supervision_just: z.string().min(10),
    responsabilidad: z.number().min(1).max(5),
    responsabilidad_just: z.string().min(10),
    condiciones: z.number().min(1).max(5),
    condiciones_just: z.string().min(10),
    error: z.number().min(1).max(5),
    error_just: z.string().min(10),
    requisitos: z.number().min(1).max(5),
    requisitos_just: z.string().min(10),
  }),
  auditoria: z.object({
    motor: z.string(),
    buildVersion: z.string(),
    timestamp: z.string(),
    confidence: z.number().min(0).max(1),
    evidenceFound: z.array(z.string()),
  }),
});
```

Si la respuesta no cumple el esquema (ej: grado fuera de rango, justificación
muy corta), el pipeline **lanza un error** y no genera reporte.

## Etapa 4: Guardrails (Filtro de Objetividad)

**Archivo:** `server/src/services/guardrails.ts`

El reporte validado pasa por dos filtros:

### 4.1 Detección de Incertidumbre

Se buscan palabras clave en las justificaciones que indican falta de certeza:

```
"probablemente", "quizás", "tal vez", "podría ser", "es posible",
"no está claro", "incierto", "aproximadamente", "casi seguro"
```

Si se detecta alguna, se genera una advertencia (`warning`) y se reduce
la confianza del reporte.

### 4.2 Coherencia de Grados

Se verifica que la evidencia citada en la justificación sea suficiente
para el grado asignado. Si la justificación usa palabras como
"no hay evidencia concluyente" o "insuficiente", se genera una alerta.

```typescript
function validateObjectivity(report: ValuationReport) {
  const uncertaintyWords = [
    'probablemente', 'quizás', 'tal vez', 'podría ser',
    'es posible', 'no está claro', 'incierto',
    'aproximadamente', 'casi seguro',
  ];

  const warnings: string[] = [];

  for (const [key, value] of Object.entries(report.evaluacion)) {
    if (key.endsWith('_just')) {
      for (const word of uncertaintyWords) {
        if (value.toLowerCase().includes(word)) {
          warnings.push(`Se detectó lenguaje de incertidumbre: "${word}"`);
          break;
        }
      }
    }
  }

  const keys = ['dificultad', 'supervision', 'responsabilidad',
                'condiciones', 'error', 'requisitos'];
  for (const k of keys) {
    const grade = report.evaluacion[k];
    if (grade < 1 || grade > 5) {
      warnings.push(`Grado fuera de rango para factor ${k}: ${grade}`);
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
```

## Reporte de Auditoría

La salida del pipeline es un `ValuationReport` que contiene:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `puesto_id` | `string` | ID del puesto evaluado |
| `totalPuntos` | `number` | Suma de puntos de todos los factores |
| `evaluacion` | `object` | Grados y justificaciones por factor |
| `auditoria.motor` | `string` | Motor de IA usado (`llm`) |
| `auditoria.buildVersion` | `string` | Versión del pipeline |
| `auditoria.confidence` | `number` | Confianza del reporte (0–1) |
| `auditoria.evidenceFound` | `string[]` | Evidencias detectadas |
| `warnings` | `string[]` | Alertas de guardrails |

## Trazabilidad Visual (Frontend)

**Archivo:** `frontend/src/components/evaluation/EvidenceReport.tsx`

El componente `EvidenceReport` muestra:

- Desglose por factor con grado y justificación
- Alertas de guardrails (si hay)
- Motor, versión y nivel de confianza

## Ajuste Humano

**Archivo:** `frontend/src/components/evaluation/AdjustmentPanel.tsx`

El evaluador humano puede:

- Sobreescribir el grado de cualquier factor
- Ingresar una nueva justificación
- El reporte se marca como `humanOverridden: true`

## Persistencia

**Endpoint:** `POST /api/valoracion/pipeline/save`

Al guardar se persisten:

- Los grados y puntajes en `Evaluacion`
- Los metadatos de auditoría en columnas dedicadas:
  - `motor` — motor de IA
  - `buildVersion` — versión del pipeline
  - `auditoria` — reporte completo en JSON
- Registro de auditoría en tabla `Auditoria`

## Descarga de Informe PDF

**Endpoint:** `GET /api/evaluaciones/:id/report`

Genera un PDF con pdfkit que incluye:

- Encabezado institucional
- Datos del puesto evaluado
- Descripción de funciones
- Tabla de factores con puntajes y barras de progreso
- Justificaciones detalladas por factor
- Scorecard de resultado con clase y serie
- Bloque de firmas

## Flujo Completo (Frontend a Backend)

```
Usuario                    Frontend                      Backend
  │                          │                              │
  │  Selecciona puesto       │                              │
  │ ──────────────────────► │                              │
  │                          │                              │
  │  Click "Evaluar con IA"  │                              │
  │ ──────────────────────► │                              │
  │                          │  POST /api/valoracion/pipeline│
  │                          │ ─────────────────────────────►│
  │                          │                              │
  │                          │                              ├─ Recopilar docs
  │                          │                              ├─ LLM → grados
  │                          │                              ├─ Zod validation
  │                          │                              ├─ Guardrails filter
  │                          │                              │
  │                          │  ◄── Reporte de Auditoría ──│
  │                          │                              │
  │  Ve resultados           │                              │
  │  (opcional: ajusta)      │                              │
  │                          │                              │
  │  Click "Guardar"         │                              │
  │ ──────────────────────► │                              │
  │                          │  POST /api/valoracion/pipeline/save
  │                          │ ─────────────────────────────►│
  │                          │                              ├─ Crear Evaluacion
  │                          │                              ├─ Guardar auditoría
  │                          │                              ├─ Crear Auditoria
  │                          │                              │
  │                          │  ◄── evaluacion_id ──────────│
  │                          │                              │
  │  Click "Descargar PDF"   │                              │
  │ ──────────────────────► │                              │
  │                          │  GET /api/evaluaciones/:id/report
  │                          │ ─────────────────────────────►│
  │                          │                              ├─ Consultar datos
  │                          │                              ├─ Generar PDF
  │                          │                              │
  │  ◄── Descarga PDF ───── │  ◄── application/pdf ────────│
```

## Tests

**Archivo:** `server/src/__tests__/guardrails.test.ts`

Se prueban 4 escenarios:

1. **Detección de incertidumbre** — texto con "probablemente" → genera warning
2. **Reporte limpio** — justificaciones firmes → sin warnings
3. **Grado fuera de rango** — grado 6 en dificultad → warning
4. **Evidencia insuficiente** — justificación contradictoria → warning
