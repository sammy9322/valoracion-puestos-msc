# Checkpoint - Estado del Proyecto (01 Junio 2026)

## 📌 Contexto General
El día de hoy estuvimos resolviendo problemas críticos en el motor de evaluación de inteligencia artificial (`aiAgentService.ts`) del proyecto de Valoración de Puestos (MSC).

El problema principal era que el reporte HTML **no estaba mostrando la sección de "Discrepancias y Aportes de la Entrevista"** y además había una **variabilidad inaceptable** en las notas finales generadas por la IA (ej. saltos de 625 a 705 puntos para el mismo puesto).

## 🛠️ Problemas Resueltos Hoy

### 1. Visibilidad de Contradicciones en el HTML
- **Diagnóstico:** El sistema solo marcaba `contradiccion = true` si la IA matemáticamente lograba subir el grado base del factor (`isGradeRaised`). Si la IA usaba la entrevista pero mantenía la misma nota, la discrepancia se ocultaba.
- **Solución:** Se modificó `aiAgentService.ts` para que `contradiccion = !!(citaEntrevista && citaDocumental)`. Esto asegura que cualquier factor donde la entrevista haya aportado contexto se muestre obligatoriamente en el reporte.
- **Impacto Frontend:** Se ajustó el título en `htmlReportGenerator.ts` a *"Análisis de Discrepancias y Aportes de la Entrevista"* para reflejar que la sección ahora muestra enriquecimientos de la IA y no solo contradicciones puras.

### 2. Estabilización de la IA y Erradicación de Variabilidad
- **Diagnóstico:** Los saltos masivos de 80 puntos ocurrían por dos motivos:
  1. Caídas silenciosas por límite de cuotas de Google en modelos erróneos o saturados (`gemini-2.5-flash` que no existe, o `gemini-1.5-pro` que tiene un límite gratis muy estricto), forzando a la app a usar el "Motor de Reglas" de emergencia (625 pts base).
  2. La naturaleza estocástica de los modelos MoE (Mixture of Experts) como la familia Flash, que dudaban en las fronteras de decisión y oscilaban entre `baseGrado` y `baseGrado + 1`.
- **Solución (Implementada por OpenCode):** 
  - Se blindó la configuración de Gemini en `aiAgentService.ts` usando el modelo estable `gemini-1.5-flash-latest`.
  - Se inyectaron **candados estadísticos absolutos (greedy decoding)** en el `generationConfig`:
    - `temperature: 0`
    - `topK: 1`
    - `topP: 0.1`
  - Esto apaga la creatividad de la IA y fuerza un determinismo matemático, eliminando las fluctuaciones en las notas.

## 🚀 Estado de la Aplicación y Despliegue
- La aplicación web en Vercel está funcional.
- Todos los commits de hoy fueron empujados al branch `master` en GitHub.
- Los reportes generados a partir de ahora deberían ser estables y mostrar correctamente la sección 3 cuando la entrevista aporta contexto.

## 📅 Siguientes Pasos para Mañana
1. **Verificar estabilidad en producción:** Correr un par de puestos con entrevista cargada en la versión de producción (Vercel) para confirmar empíricamente que la nota se mantiene idéntica en múltiples corridas.
2. **Revisar alertas:** Confirmar en los reportes generados que el "Motor de Evaluación" siempre diga "Agente de IA" y no haya caído en el fallback (Motor de Reglas).
3. **Liberación:** Si las pruebas de estabilidad son exitosas, dar el visto bueno final para el uso productivo masivo por parte de los usuarios de MSC.
