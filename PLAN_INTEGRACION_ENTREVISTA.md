# Plan Detallado de Integración de Entrevistas Estructuradas al Agente de Valoración de Puestos

## 1. Objetivo

Permitir que el agente de valoración integre, compare y utilice información proveniente tanto de registros oficiales (Supabase) como de entrevistas estructuradas externas (.md), enriqueciendo el análisis y la asignación de puntos sin perder trazabilidad, transparencia ni objetividad. El proceso debe asegurar alertas claras ante cualquier contradicción detectada entre fuentes.

---

## 2. Flujo General del Pipeline

### Orden de prioridad de fuentes:
1. **Supabase — Descripción de funciones** (máxima prioridad)
2. **Supabase — Procedimientos del puesto** (segunda prioridad)
3. **Entrevista estructurada (.md)** (tercera prioridad, fuente auxiliar)

---

## 3. Lógica y Reglas de Extracción y Análisis

### 3.1 Entrada de datos
- Se cargan los registros oficiales desde Supabase y, si existe, el archivo de entrevista en formato Markdown.
- El archivo .md debe tener encabezado identificativo, fecha, campo para puesto_id, y preguntas/respuestas mapeables a los factores.

### 3.2 Contextualización previa a la extracción
- Antes de citar, el agente debe analizar el texto de cada fuente para entender el contexto y significado respecto al factor. 
- Se extraen como cita sólo los fragmentos que realmente son relevantes, completos y lógicos para el factor (no meras coincidencias de palabras).
- Se evalúa:
  - Si la evidencia es **directa** (descripción clara y específica del factor).
  - Si es **indirecta** (circunstancial, apoyo parcial).
  - Si es **insuficiente** (ausente, poco clara o irrelevante).

### 3.3 Extracción y etiquetado multifuente
- De cada fuente, guardar:
  - Cita textual (fragmento citado)
  - Etiqueta de fuente: ("Supabase-DF", "Supabase-Proc", "Entrevista")
  - Contextualización: breve justificación de por qué esa cita es pertinente.
- Si sólo una fuente provee evidencia, se señala en el reporte.
- Si varias fuentes tienen evidencia, se muestran todas en el análisis.

---

## 4. Comparación, Resolución de Conflictos y Alertas

### 4.1 Comparador de evidencia por factor
- El agente revisa si hay contradicción sustantiva (lo relatado por la entrevista o por procedimientos es diferente a la descripción oficial).
- **Reglas de conflicto**:
  - Prevalece siempre la evidencia oficial/documental para la asignación de puntos.
  - La evidencia de entrevista no puede sobrescribir la oficial, pero sí complementarla o matizarla.
  - Si hay contradicción, genera automáticamente una alerta de incoherencia en el reporte.
  - La alerta debe mostrar:
    - Factor afectado
    - Fragmentos citados de ambas (o todas) las fuentes
    - Naturaleza del conflicto (descripción breve)
    - Recomendación de acción (ej: “Validar documentalmente antes de la decisión final”)

---

## 5. Reporte y Documentación

### 5.1 Estructura de salida para cada factor
- Factor: [nombre]
- Fuente principal (cita y justificación)
- Fuente secundaria/procedimental, si existe (cita y justificación)
- Fuente de entrevista, si existe (cita y justificación)
- Grado asignado y puntuación
- Nivel de soporte: “100% documental”, “enriquecido con entrevista”, “solo testimonial/entrevista”
- Alertas de incoherencia, si aplican

### 5.2 Sección global de alertas
- Listado consolidado de todas las incoherencias o debilidades detectadas factor por factor.

### 5.3 Recomendaciones y sugerencias de remediación
- Si un factor tuvo que alimentarse sólo por la entrevista, sugerir cargar la evidencia correspondiente en Supabase.
- Si existe contradicción relevante, sugerir auditoría y resolución.

---

## 6. Consideraciones Técnicas y Operativas

- El mapping preguntas-factores debe estar versionado y ser expandible si los factores cambian en futuras versiones.
- El pipeline nunca debe bloquear la generación del reporte (aunque la mayoría de la evidencia venga de la entrevista, el análisis se entrega con advertencias claras).
- Todos los datos fuente (supabase, .md) y artefactos del reporte deben guardarse para auditoría y trazabilidad.
- Definir reglas automáticas para identificar contradicción (ejemplo: análisis de opuestos en los fragmentos, discordancia numérica clara, etc.).

---

## 7. Ejemplo de formato de entrada de entrevista (.md)

```markdown
# Entrevista Estructurada — Valoración de Puesto
- Puesto evaluado: Nombre
- Puesto ID: 123
- Fecha de entrevista: 2026-05-21
- Entrevistado: iniciales/rol
- Entrevistador: nombre
- Versión de formulario: 1.0

## Factor: Complejidad y Dificultad
**Pregunta:** [texto pregunta]
Respuesta: [texto respuesta]
...
```

---

## 8. Ejemplo de reporte final por factor

| Factor              | Grado | Puntos | Fuente principal    | Cita principal      | Fuente secundaria | Cita secundaria  | Fuente Entrevista | Cita Entrevista    | Soporte   | Alerta      |
|---------------------|-------|--------|---------------------|---------------------|-------------------|------------------|-------------------|--------------------|-----------|-------------|
| Supervisión ejercida|  2    |  20    | Supabase-DF         | “Supervisa...”      | Procedimiento     | “Aprueba...”     | Entrevista        | “Suele rotar...”   | Enriquecido Doc+Entrevista | Contradicción registrada |

---

## 9. Recomendaciones adicionales

- Iniciar la integración en modo "opt-in": el pipeline leerá la evidencia del .md solo si está presente.
- Proveer ejemplos y capacitaciones a quienes generen entrevistas para máxima calidad en insumos.
- Incluir controles de versión para entrevistas y su relación clara al análisis y reporte.
- Considerar evidencia de la entrevista solo para aquellos factores donde la documental no sea suficiente, marcando siempre nivel de confianza.
- Automatizar la alerta y destacar contradicciones relevantes de modo fácil y visible.

---

**Este plan está listo para ser copiado como archivo .md para uso interno, documentación y/o inicio de desarrollo. Si requieres una estructura de carpetas, convención de nombres, o formato diferente, indícalo y se adapta.**
