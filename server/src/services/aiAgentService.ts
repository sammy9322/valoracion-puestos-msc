import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'deepseek-coder-v2:latest';

console.log(`[AI Service] Configurado con modelo: ${DEFAULT_MODEL} en ${OLLAMA_URL}`);

export const POINTS_MAP: Record<string, number[]> = {
  dificultad: [0, 40, 80, 120, 160, 200],
  supervision: [0, 30, 60, 90, 120, 150],
  responsabilidad: [0, 40, 80, 120, 160, 200],
  condiciones: [0, 20, 40, 60, 80, 100],
  error: [0, 30, 60, 90, 120, 150],
  requisitos: [0, 40, 80, 120, 160, 200]
};

const GRADE_DESCRIPTIONS: Record<string, string[]> = {
  dificultad: [
    'Grado 1 (0 pts): Tareas simples y repetitivas, poca iniciativa.',
    'Grado 2 (40 pts): Tareas variadas pero estandarizadas.',
    'Grado 3 (80 pts): Requiere análisis y juicio para resolver problemas técnicos.',
    'Grado 4 (120 pts): Alta complejidad, planeación y coordinación institucional.',
    'Grado 5 (160 pts): Dirección estratégica y toma de decisiones críticas.'
  ],
  supervision: [
    'Grado 1 (0 pts): No ejerce supervisión.',
    'Grado 2 (30 pts): Supervisión ocasional de tareas simples.',
    'Grado 3 (60 pts): Supervisión de un grupo de trabajo operativo.',
    'Grado 4 (90 pts): Jefatura de una unidad o departamento.',
    'Grado 5 (120 pts): Dirección de un área técnica o administrativa mayor.'
  ],
  responsabilidad: [
    'Grado 1 (0 pts): Baja responsabilidad por valores o equipo.',
    'Grado 2 (40 pts): Responsabilidad moderada por materiales y herramientas.',
    'Grado 3 (80 pts): Custodia de información sensible o fondos fijos.',
    'Grado 4 (120 pts): Responsabilidad por presupuestos o activos de alto valor.',
    'Grado 5 (160 pts): Responsabilidad total por la gestión de un proceso clave.'
  ],
  condiciones: [
    'Grado 1 (0 pts): Ambiente de oficina normal, riesgos mínimos.',
    'Grado 2 (20 pts): Esfuerzo físico moderado o ambiente algo incómodo.',
    'Grado 3 (40 pts): Exposición a condiciones climáticas o ruido constante.',
    'Grado 4 (60 pts): Riesgo de accidentes laborales o manejo de químicos.',
    'Grado 5 (80 pts): Condiciones de alta peligrosidad o insalubridad constante.'
  ],
  error: [
    'Grado 1 (0 pts): Error fácil de detectar y corregir.',
    'Grado 2 (30 pts): Error causa retrasos menores en el flujo de trabajo.',
    'Grado 3 (60 pts): Error afecta a otros departamentos o al servicio al cliente.',
    'Grado 4 (90 pts): Error causa pérdidas económicas o legales significativas.',
    'Grado 5 (120 pts): Error compromete la estabilidad institucional o seguridad pública.'
  ],
  requisitos: [
    'Grado 1 (0 pts): Educación básica o primaria.',
    'Grado 2 (40 pts): Bachillerato en Educación Media o Técnico básico.',
    'Grado 3 (80 pts): Diplomado o Técnico superior especializado.',
    'Grado 4 (120 pts): Bachillerato Universitario o Licenciatura profesional.',
    'Grado 5 (160 pts): Grado de Maestría o especialización avanzada requerida.'
  ]
};

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

export interface AIEvaluationResult {
  success: boolean;
  data: EvaluationSuggestion;
  totalPuntos: number;
  puesto_id: string;
  analisis_completo: boolean;
}

const FACTOR_NAMES: Record<string, string> = {
  dificultad: 'Dificultad de Funciones',
  supervision: 'Supervisión Ejercida',
  responsabilidad: 'Responsabilidad',
  condiciones: 'Condiciones de Trabajo',
  error: 'Consecuencia del Error',
  requisitos: 'Requisitos'
};

const FACTOR_PROMPTS: Record<string, string> = {
  dificultad: 'Evalúa la complejidad de las tareas descritas: ¿son repetitivas o requieren análisis, planeación, o dirección estratégica?',
  supervision: 'Evalúa el nivel de supervisión que el puesto ejerce sobre otros: ¿tiene personal a cargo, supervisa equipos, o dirige un área?',
  responsabilidad: 'Evalúa el nivel de responsabilidad por valores, equipos, información sensible o presupuestos que maneja el puesto.',
  condiciones: 'Evalúa las condiciones físicas y ambientales del puesto: ¿es oficina, tiene esfuerzo físico, exposición a riesgos, o insalubridad?',
  error: 'Evalúa el impacto institucional de un error en este puesto: ¿es fácil de corregir o puede comprometer la estabilidad institucional?',
  requisitos: 'Evalúa los requisitos académicos y de experiencia necesarios: desde educación básica hasta maestría especializada.'
};

function sanitizeInput(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function buildPrompt(puesto: any): string {
  const gradeTable = Object.entries(GRADE_DESCRIPTIONS)
    .map(([factor, grades]) => {
      const header = FACTOR_NAMES[factor] || factor;
      return `${header}:\n${grades.map(g => `  ${g}`).join('\n')}`;
    })
    .join('\n\n');

  const factorAnalysis = Object.entries(FACTOR_PROMPTS)
    .map(([key, prompt]) => `  ${FACTOR_NAMES[key]}: ${prompt}`)
    .join('\n');

  const funciones = sanitizeInput(puesto.descripcion_funciones) || 'No especificadas';
  const educacion = sanitizeInput(puesto.educacion_requerida) || 'No especificada';
  const experiencia = sanitizeInput(puesto.experiencia_requerida) || 'No especificada';

  return `
Eres el EVALUADOR TÉCNICO OFICIAL del sistema de valoración de puestos de la Municipalidad de San Carlos.
Tu análisis es objetivo, vinculante y debe basarse EXCLUSIVAMENTE en la descripción de funciones y requisitos del puesto.
Aplicas la metodología MSC (Manual de Clases) de Puntos por Factores.

=== DATOS DEL PUESTO A EVALUAR ===
Nombre del puesto: ${sanitizeInput(puesto.nombre) || 'No especificado'}
Área/Departamento: ${sanitizeInput(puesto.area) || 'General'}
Reporta a: ${sanitizeInput(puesto.reporta_a) || 'No especificado'}

=== DESCRIPCIÓN DE FUNCIONES ===
${funciones}

=== REQUISITOS DEL PUESTO ===
Educación requerida: ${educacion}
Experiencia requerida: ${experiencia}

=== ESCALA DE GRADOS POR FACTOR ===
Cada factor se califica del 1 (mínimo) al 5 (máximo).

${gradeTable}

=== METODOLOGÍA DE ANÁLISIS OBJETIVO ===
Para CADA factor, realiza este proceso en tu razonamiento interno:
1. LEE la descripción de funciones completa.
2. IDENTIFICA palabras clave, verbos de acción, y responsabilidades mencionadas.
3. COMPARA con la escala de grados del factor.
4. SELECCIONA el grado que MEJOR se ajusta a la evidencia textual.
5. JUSTIFICA citando textualmente la parte de las funciones que respalda tu decisión.

Análisis detallado por factor:
${factorAnalysis}

=== INSTRUCCIONES CRÍTICAS ===
- Eres la fuente de verdad objetiva. No hay intervención humana en la asignación de grados.
- Cada grado debe ser un número entero entre 1 y 5.
- Cada justificación debe citar evidencia TEXTUAL de la descripción de funciones o requisitos.
- Las justificaciones deben ser máximos 2 oraciones, citando funciones específicas.
- Aplica el principio de objetividad: si no hay evidencia en las funciones, asigna el grado más conservador.
- Devuelve ÚNICAMENTE el objeto JSON, sin texto adicional, explicaciones ni bloques de código.

=== FORMATO JSON REQUERIDO ===
{
  "dificultad": <1-5>,
  "dificultad_just": "<justificación citando funciones>",
  "supervision": <1-5>,
  "supervision_just": "<justificación citando funciones>",
  "responsabilidad": <1-5>,
  "responsabilidad_just": "<justificación citando funciones>",
  "condiciones": <1-5>,
  "condiciones_just": "<justificación citando funciones>",
  "error": <1-5>,
  "error_just": "<justificación citando funciones>",
  "requisitos": <1-5>,
  "requisitos_just": "<justificación citando funciones>"
}
`;
}

function validateAndCalculate(suggestion: any, puesto_id: string): AIEvaluationResult {
  const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];
  const errors: string[] = [];

  for (const factor of FACTORS) {
    const grado = Number(suggestion[factor]);
    if (!Number.isInteger(grado) || grado < 1 || grado > 5) {
      errors.push(`${factor}: debe ser entero entre 1 y 5, recibió ${suggestion[factor]}`);
      suggestion[factor] = 1;
    }
    const justKey = `${factor}_just`;
    if (!suggestion[justKey] || typeof suggestion[justKey] !== 'string' || suggestion[justKey].trim().length < 5) {
      errors.push(`${justKey}: justificación muy corta o vacía`);
      suggestion[justKey] = suggestion[justKey] || 'Análisis basado en la descripción de funciones del puesto.';
    }
  }

  let totalPuntos = 0;
  for (const factor of FACTORS) {
    totalPuntos += POINTS_MAP[factor][suggestion[factor]];
  }

  return {
    success: errors.length === 0,
    data: suggestion as EvaluationSuggestion,
    totalPuntos,
    puesto_id,
    analisis_completo: errors.length === 0
  };
}

async function callOllama(prompt: string): Promise<any> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.3 }
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

export const aiAgentService = {
    async suggestEvaluation(puesto: any): Promise<EvaluationSuggestion | null> {
        try {
            const prompt = buildPrompt(puesto);
            const result = await callOllama(prompt);
            return result as EvaluationSuggestion;
        } catch (error: any) {
            console.error('[AI Agent Service] Error en suggestEvaluation:', error);
            if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
                throw new Error('Ollama no está ejecutándose en ' + OLLAMA_URL);
            }
            throw new Error(error.message || 'Error al comunicarse con la IA local');
        }
    },

    async evaluate(puesto: any): Promise<AIEvaluationResult> {
        try {
            const prompt = buildPrompt(puesto);
            const raw = await callOllama(prompt);
            const validated = validateAndCalculate(raw, puesto.id);
            return validated;
        } catch (error: any) {
            console.error('[AI Agent Service] Error en evaluate:', error);
            if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
                throw new Error('Ollama no está ejecutándose en ' + OLLAMA_URL);
            }
            throw new Error(error.message || 'Error al comunicarse con la IA local');
        }
    }
};
