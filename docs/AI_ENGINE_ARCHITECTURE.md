# Arquitectura del Motor de Evaluación IA (MSC)
**Fecha de Checkpoint:** Mayo 2026
**Módulo:** `aiAgentService.ts` / `contextualAnalyzer.ts`

## 1. Visión General y Problema Resuelto
El motor de evaluación de puestos de la Municipalidad de San Carlos (MSC) fue diseñado para aplicar la metodología de Puntos por Factores. Inicialmente, el uso de Modelos de Lenguaje Grandes (LLMs) puros presentaba un problema de **alta variabilidad (alucinaciones matemáticas)**, donde el mismo puesto podía recibir entre 570 y 720 puntos en evaluaciones consecutivas debido a la libertad creativa del LLM.

Este rediseño arquitectónico transforma al agente de IA de un "creador libre de puntajes" a un **"Auditor de Realidad Operativa"**, garantizando estabilidad matemática, consistencia y trazabilidad.

## 2. Los 3 Pilares de Recolección (Multifuente)
Antes de invocar a la Inteligencia Artificial, el sistema recolecta un contexto determinista:
1. **Ficha Oficial (El Papel):** Funciones, estrato, área y jerarquía extraídos de la base de datos.
2. **Procedimientos SIM (El Trabajo Real):** Se inyectan las tareas operativas exactas documentadas en el módulo de Control Interno donde el puesto tiene participación.
3. **Entrevistas Estructuradas (La Realidad Humana):** Testimonios, resumen y citas textuales recopiladas de la entrevista al ocupante actual.

## 3. Lógica del "Anchored Baseline" (El Ancla)
Para eliminar la variabilidad al 100%, la arquitectura implementa una evaluación de dos fases:

### Fase A: Motor de Reglas (Baseline)
- Todo puesto pasa primero por un analizador de reglas estáticas (`contextualEvaluate`).
- Asigna un puntaje base predecible basado únicamente en la Ficha y los Procedimientos.
- Este puntaje es inmutable y matemáticamente comprobable.

### Fase B: Auditoría IA (Anchored Prompting)
- Se inyecta el Puntaje Base al *Prompt* del LLM (`gemini-2.5-flash`).
- Se le impone a la IA una instrucción inquebrantable: **"Tu única misión es auditar la entrevista frente a la Línea Base. Solo puedes alterar un grado si la entrevista demuestra irrefutablemente responsabilidades superiores."**
- La IA ya no calcula desde cero; solo funciona como un juez que revisa si la evidencia de la entrevista es suficiente para otorgar puntos extra.

## 4. El Rol de la Entrevista (Insumo Primario)
La entrevista es la única llave capaz de modificar el Puntaje Base. 
- Si no hay entrevista, la IA devuelve los grados base intactos (variabilidad = 0).
- El agente está obligado por sistema a:
  - Citar textualmente entre comillas (`"..."`) las declaraciones del trabajador que justifican el aumento de grado.
  - Cambiar el campo `fuente` a `entrevista` o `mixta`.
  - Alertar si el trabajador menciona tareas que contradicen abiertamente el Manual de Clases.

## 5. Prevención de Fallos y Estructura
- **Estructura Estricta:** Se usa `responseMimeType: 'application/json'` y se fuerza a Gemini a responder con campos exactos validados internamente (grados del 1 al 5, justificaciones, citas y fuentes).
- **Fallback Determinista:** Si la API de Google falla (403, 404, Cuota agotada), el bloque `catch` atrapa el error inmediatamente, aplica el `Baseline` silenciosamente y añade una alerta al informe indicando: *"Servicio de IA no disponible temporalmente. Se aplicó evaluación basada en reglas. Asigne puntos extra manualmente si la entrevista lo justifica."*
- **Ahorro de Cuota:** Se redujo el *Ensemble Prompting* (llamadas redundantes) de 3 a 1, optimizando recursos sin perder fiabilidad gracias a la inyección del Ancla.

---
*Este documento sirve como contexto arquitectónico para futuros desarrolladores (agentes o humanos) que extiendan o den mantenimiento al pipeline de IA del proyecto MSC.*
