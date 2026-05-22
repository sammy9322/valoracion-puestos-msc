const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'deepseek-coder-v2:latest';

export interface InterviewQuote {
  factor: string;
  cita_textual: string;
  contexto: string;
  relevancia: 'alta' | 'media' | 'baja';
}

export interface FactorAnalysis {
  factor: string;
  citas: InterviewQuote[];
  resumen_entrevista: string;
  evidencia_tipo: 'testimonial';
}

export interface InterviewContext {
  entrevistado: string;
  puesto: string;
  fecha_entrevista: string;
  factores: FactorAnalysis[];
  alertas: string[];
}

const FACTORES_METODOLOGICOS = [
  { id: 'dificultad', label: 'Dificultad de Funciones', keywords: ['complejidad', 'análisis', 'planeación', 'técnico', 'difícil', 'complejo', 'sencillo', 'rutina'] },
  { id: 'supervision', label: 'Supervision Ejercida', keywords: ['superviso', 'jefe', 'coordino', 'dirijo', 'equipo', 'personal a cargo', 'subordinados'] },
  { id: 'responsabilidad', label: 'Responsabilidad', keywords: ['responsable', 'custodia', 'presupuesto', 'activos', 'información sensible', 'decisiones'] },
  { id: 'condiciones', label: 'Condiciones de Trabajo', keywords: ['condiciones', 'ambiente', 'ruido', 'clima', 'esfuerzo', 'riesgo', 'peligro', 'oficina'] },
  { id: 'error', label: 'Consecuencia del Error', keywords: ['error', 'consecuencia', 'impacto', 'pérdida', 'daño', 'multa', 'legal', 'económico'] },
  { id: 'requisitos', label: 'Requisitos', keywords: ['educación', 'universidad', 'título', 'experiencia', 'años', 'curso', 'capacitación', 'conocimiento'] },
];

async function callOllama(prompt: string): Promise<any> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.1 }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  const jsonText = data.response;
  const match = jsonText.match(/\{[\s\S]*\}/);
  const cleanJson = match ? match[0] : jsonText;
  return JSON.parse(cleanJson);
}

function buildPreprocessPrompt(rawText: string): string {
  const factoresDesc = FACTORES_METODOLOGICOS
    .map(f => `- "${f.id}": ${f.label}`)
    .join('\n');

  return `Eres un analista de valoración de puestos. Recibirás una transcripción de entrevista laboral en texto plano (formato PLAUD).

Tu tarea es:
1. Identificar al entrevistado, puesto y fecha si aparecen en el texto.
2. Para cada uno de los 6 factores metodológicos listados abajo, extraer citas textuales relevantes de la transcripción.
3. Devolver un objeto JSON con la siguiente estructura exacta:

{
  "entrevistado": "nombre o ''",
  "puesto": "nombre del puesto o ''",
  "fecha_entrevista": "fecha o ''",
  "factores": [
    {
      "factor": "dificultad",
      "citas": [
        {
          "cita_textual": "texto exacto extraído",
          "contexto": "breve contexto de la cita",
          "relevancia": "alta|media|baja"
        }
      ],
      "resumen_entrevista": "resumen breve de lo dicho sobre este factor"
    }
  ],
  "alertas": ["lista de alertas si hay contradicciones o falta información"]
}

Los 6 factores son:
${factoresDesc}

Reglas:
- Cada cita debe ser textual (copiar exactamente lo que dijo el entrevistado).
- Si un factor no tiene información, devolver array vacío en citas y resumen "Sin información en la entrevista".
- Ser objetivo: no inventar citas que no existen.
- Si hay contradicciones entre lo dicho y lo que normalmente se esperaría, agregar una alerta.

TRANSCRIPCIÓN:
${rawText}`;
}

export function extractMetadata(rawText: string): { entrevistado: string; puesto: string; fecha: string } {
  const lines = rawText.split('\n').slice(0, 20);
  let entrevistado = '';
  let puesto = '';
  let fecha = '';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!entrevistado && (lower.includes('entrevistado') || lower.includes('nombre') || lower.includes('entrevista a'))) {
      const match = line.match(/[:]\s*(.+)/);
      if (match) entrevistado = match[1].trim();
    }
    if (!puesto && (lower.includes('puesto') || lower.includes('cargo') || lower.includes('posición'))) {
      const match = line.match(/[:]\s*(.+)/);
      if (match) puesto = match[1].trim();
    }
    if (!fecha && (lower.includes('fecha') || lower.includes('día'))) {
      const match = line.match(/[:]\s*(.+)/);
      if (match) fecha = match[1].trim();
    }
  }

  return { entrevistado, puesto, fecha };
}

export async function parseEntrevistaMD(
  input: Buffer | string,
  meta?: { filename?: string }
): Promise<InterviewContext> {
  const rawText = typeof input === 'string' ? input : input.toString('utf8');

  if (rawText.length < 10) {
    return {
      entrevistado: '',
      puesto: '',
      fecha_entrevista: '',
      factores: FACTORES_METODOLOGICOS.map(f => ({
        factor: f.id,
        citas: [],
        resumen_entrevista: 'Texto insuficiente para análisis.',
        evidencia_tipo: 'testimonial' as const
      })),
      alertas: ['El archivo no contiene suficiente texto para procesar.']
    };
  }

  const metadata = extractMetadata(rawText);
  const prompt = buildPreprocessPrompt(rawText);

  try {
    const llmResult = await callOllama(prompt);

    return {
      entrevistado: llmResult.entrevistado || metadata.entrevistado || '',
      puesto: llmResult.puesto || metadata.puesto || '',
      fecha_entrevista: llmResult.fecha_entrevista || metadata.fecha || '',
      factores: FACTORES_METODOLOGICOS.map(f => {
        const encontrado = (llmResult.factores || []).find((fx: any) => fx.factor === f.id);
        return {
          factor: f.id,
          citas: encontrado?.citas || [],
          resumen_entrevista: encontrado?.resumen_entrevista || 'Sin información en la entrevista.',
          evidencia_tipo: 'testimonial' as const
        };
      }),
      alertas: llmResult.alertas || []
    };
  } catch (error) {
    console.error('[InterviewParser] Error calling Ollama for preprocessing:', error);
    return {
      entrevistado: metadata.entrevistado || '',
      puesto: metadata.puesto || '',
      fecha_entrevista: metadata.fecha || '',
      factores: FACTORES_METODOLOGICOS.map(f => ({
        factor: f.id,
        citas: [],
        resumen_entrevista: 'Error al procesar la entrevista con el LLM.',
        evidencia_tipo: 'testimonial' as const
      })),
      alertas: ['Error de conexión con Ollama. Verifique que el servicio esté disponible.']
    };
  }
}
