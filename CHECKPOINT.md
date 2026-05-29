# CHECKPOINT — Evaluación de Puestos MSC

**Fecha:** 29/05/2026
**Proyecto:** Valoración de Puestos MSC — Municipalidad de San Carlos
**Contexto completo para retomar el trabajo al día siguiente**

---

## 1. ESTADO ACTUAL DEL PROYECTO

El sistema de valoración de puestos es un modelo híbrido dual (Motor LLM Gemini 2.5 Flash + Fallback basado en reglas). Hemos logrado la consistencia técnica y matemática de toda la infraestructura bajo la metodología oficial de 1000 puntos. 

**Logros de la última sesión:**
1. **Calibración a 1000 Puntos:** Sincronizados todos los `maxPts`, matrices y frontend para que los factores sumen exactamente 1000 puntos (Dificultad 200, Supervisión 150, Responsabilidad 200, Condiciones 100, Error 150, Requisitos 200).
2. **Alertas de Contradicción Inline:** El reporte ahora muestra recuadros ámbar específicos debajo de cada factor afectado cuando existe discrepancia entre la Ficha Oficial y la Entrevista.
3. **Resiliencia API Gemini:** Se inyectó el `responseSchema` para forzar JSON estructural y se construyó un bloque de _retry_ (reintento a 1s) para mitigar fallos transitorios de red. Sin embargo, persisten bloqueos si se excede la cuota estricta (429) de Gemini Flash Free Tier (15 RPM).

---

## 2. ARQUITECTURA DE EVALUACIÓN

El pipeline (`aiAgentService.ts`) procesa el puesto así:
1. **enrichProc:** Inyecta tareas operativas desde la base de datos (Supabase).
2. **ruleBasedEvaluation:** Extrae verbos y genera una evaluación determinista de contingencia.
3. **buildPrompt:** Ensambla un macro-prompt usando 3 pilares: Ficha Oficial + Procedimientos (Operativo) + Entrevista (Testimonial).
4. **callGeminiEnsemble:** Invoca al LLM (ahora con `responseSchema` validado) y bloque de reintento en caso de error.
5. **validateAndCalculate:** Calcula puntos cruzando el Grado [1-6] con la Intensidad [Bajo/Medio/Alto], extrayendo los puntos medios si aplica.
6. **Reportes:** Genera visualizaciones en `WizardEvaluacion.tsx`, PDF (`reportGenerator.ts`) e HTML (`htmlReportGenerator.ts`).

---

## 3. PUNTOS PENDIENTES PARA LA PRÓXIMA SESIÓN

**Prioridad Alta (Motor de IA y Cuotas)**
1. **Gestión de Errores de Cuota (429):** Actualmente si se recibe un error 429 de Gemini, el reintento a 1 segundo no es suficiente (la cuota tarda 1 min en reiniciar). Hay que implementar un _Backoff_ exponencial más largo o avisar explícitamente en el UI "Límite de cuota alcanzado, espere 1 minuto".
2. **Depuración del Schema:** Confirmar con exactitud mediante los logs de la terminal (o PM2) cuál es la cadena de error cuando falla Gemini, para asegurar que el SDK `@google/generative-ai` no esté rechazando propiedades tipo `items: { type: SchemaType.STRING }` si la versión del paquete está desfasada.

**Prioridad Media (UX y Datos)**
1. **Revisión de Textos Justificativos:** Asegurarse de que el prompt genere justificaciones que engloben orgánicamente las citas documentales sin romper el formato JSON.
2. **Ensemble Real:** Mover `ENSEMBLE_CALLS` a 3 para promediar las calificaciones (moda estadística) de Gemini y evitar fluctuaciones en puestos límite, pero esto dependerá de no reventar la cuota gratuita.

---

## 4. ARCHIVOS CRÍTICOS MODIFICADOS RECIENTEMENTE

- `server/src/config/factorTables.ts` (Core matemático de 1000 pts)
- `server/src/services/aiAgentService.ts` (Resiliencia, Prompt y Schema)
- `server/src/services/htmlReportGenerator.ts` (Alertas inline y narrativa)
- `server/src/services/contextualAnalyzer.ts` (Línea base y topes)
- `server/src/services/reportGenerator.ts` (PDF: Color G6, grados actualizados)
- `frontend/src/pages/WizardEvaluacion.tsx` (Frontend factors_config sync)
