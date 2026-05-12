import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'deepseek-coder-v2:latest'; 

console.log(`[AI Service] Configurado con modelo: ${DEFAULT_MODEL} en ${OLLAMA_URL}`);

export interface EvaluationSuggestion {
    dificultad: number;
    dificultad_just: string;
    supervision: number;
    supervision_just: string;
    responsabilidad: number;
    responsabilidad_just: string;
    condiciones: number;
    condiciones_just: string;
    error: number;
    error_just: string;
    requisitos: number;
    requisitos_just: string;
}

export const aiAgentService = {
    /**
     * Envía los datos del puesto al modelo local para obtener una sugerencia de valoración
     * basada estrictamente en la metodología MSC.
     */
    async suggestEvaluation(puesto: any): Promise<EvaluationSuggestion | null> {
        try {
            const prompt = `
Actúa como un experto en Recursos Humanos especializado en la valoración de puestos mediante el método MSC.
Analiza el puesto "${puesto.nombre}" y determina el grado de 1 a 5 para cada factor.

ÁREA: ${puesto.area || 'General'}
FUNCIONES:
${puesto.descripcion_funciones || 'No especificadas'}

REQUISITOS:
Educación: ${puesto.educacion_requerida || 'No especificada'}
Experiencia: ${puesto.experiencia_requerida || 'No especificada'}

Instrucciones Críticas: 
1. Evalúa cada factor y asigna un grado del 1 al 5.
2. Justifica brevemente la decisión (máximo 1 oración).
3. Devuelve ÚNICAMENTE un objeto JSON válido, sin texto adicional, explicaciones ni bloques de código markdown.

Estructura requerida:
{
  "dificultad": [numero], "dificultad_just": "[justificación corta]",
  "supervision": [numero], "supervision_just": "[justificación corta]",
  "responsabilidad": [numero], "responsabilidad_just": "[justificación corta]",
  "condiciones": [numero], "condiciones_just": "[justificación corta]",
  "error": [numero], "error_just": "[justificación corta]",
  "requisitos": [numero], "requisitos_just": "[justificación corta]"
}
`;

            const response = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: DEFAULT_MODEL, 
                    prompt: prompt,
                    stream: false,
                    format: 'json',
                    options: {
                        temperature: 0.2 // Baja temperatura para mayor consistencia y objetividad
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Si el modelo envuelve la respuesta en texto, extraemos el JSON
            const jsonText = data.response;
            const match = jsonText.match(/\{[\s\S]*\}/);
            const cleanJson = match ? match[0] : jsonText;

            const result = JSON.parse(cleanJson);
            
            return result as EvaluationSuggestion;
            
        } catch (error: any) {
            console.error('[AI Agent Service] Error al consultar el modelo local:', error);
            if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
                throw new Error('Ollama no está ejecutándose en ' + OLLAMA_URL);
            }
            throw new Error(error.message || 'Error al comunicarse con la IA local');
        }
    }
};
