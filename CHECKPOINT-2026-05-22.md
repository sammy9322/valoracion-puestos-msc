# Checkpoint de Desarrollo: 22 de Mayo de 2026

Este documento detalla todas las modificaciones, resoluciones de errores y arquitecturas migradas durante la jornada de hoy. Sirve como punto de restauración y documentación de contexto para futuras sesiones.

## 1. Migración del Motor de Inteligencia Artificial (Ollama a Gemini)
El servidor dependía originalmente de una instancia local de `Ollama` (`deepseek-coder-v2`). Debido a las limitaciones de hardware de la máquina de desarrollo y problemas de desbordamiento de memoria al procesar transcripciones largas, se migró el motor a **Google Gemini en la nube**.

* **SDK Instalado:** `@google/generative-ai`
* **Modelo Actual:** `gemini-2.5-flash` (Se descartó la v1.5 por estar deprecada en la API actual).
* **Integración:** El archivo `server/src/services/aiAgentService.ts` fue reescrito. La función `callOllama` fue reemplazada por una implementación directa de `GoogleGenerativeAI`, alimentada por la variable de entorno `GEMINI_API_KEY`.
* **Archivos Modificados:** `server/src/services/aiAgentService.ts`, `server/.env`.

## 2. Soporte para Archivos de Entrevista (PLAUD) y Corrección de UI
La interfaz gráfica no permitía la selección de archivos generados por dispositivos PLAUD o presentaba un comportamiento erróneo al arrastrar los archivos.

* **Fix de Drag and Drop:** Se implementaron los eventos `onDragOver` (para prevenir que el navegador abra el archivo) y `onDrop` en el componente `WizardEvaluacion.tsx`.
* **Fix de Selección Nativa:** Se sustituyó el contenedor `<div>` por un `<label>` nativo conectado al `<input type="file">`.
* **Ampliación de Formatos:** Se eliminó la restricción estricta `accept=".txt,text/plain"` para permitir que macOS procese correctamente los archivos de texto exportados por el usuario.
* **Archivos Modificados:** `frontend/src/pages/WizardEvaluacion.tsx`.

## 3. Reestructuración del Pre-procesador de Entrevistas
El pre-procesador intentaba hacer una pre-evaluación con el LLM, lo que causaba fallos silenciosos y pérdida de contexto.

* **Inyección Cruda (Raw):** El archivo `interviewParser.ts` fue simplificado para inyectar directamente el texto de la entrevista en el *prompt* maestro del sistema multifuente.
* **Truncamiento de Seguridad:** Para evitar agotar el límite de tokens de la API, el parseador ahora recorta la transcripción a **6000 caracteres** exactos.

## 4. Resolución de Errores Críticos y de Infraestructura
Durante las pruebas de despliegue, el sistema se enfrentó a múltiples errores que detuvieron la ejecución. Todos fueron parchados.

* **Error de Compilación TypeScript (Pantalla de carga infinita):** La limpieza del código viejo generó un error de sintaxis y un error de tipo `implicit any` en la interfaz `InterviewContext`. Se re-exportaron correctamente los tipos entre `interviewParser.ts`, `aiAgentService.ts` y `evaluaciones.ts`, garantizando una compilación de 0 errores.
* **Crash en Producción Vercel (EROFS):** El mecanismo de emergencia del servidor intentaba guardar logs de error usando `fs.writeFileSync('llm_crash_log.txt')`. Como Vercel utiliza un sistema de archivos de solo lectura (*Read-Only File System / EROFS*), esto provocaba un colapso en cadena (`status 500`). La escritura a disco fue eliminada.
* **Sincronización de Variables de Entorno:** Se vinculó el proyecto localmente con el CLI de Vercel y se inyectó la `GEMINI_API_KEY` en los entornos de Preview y Production para autorizar al backend.

## Próximos Pasos (Pendientes)
* Si se requiere mejorar la precisión de Gemini, revisar y refinar los *prompts* estandarizados en `aiAgentService.ts`.
* Continuar con las siguientes épicas o mejoras en la experiencia de usuario (UX) según el roadmap del proyecto.
