import dotenv from 'dotenv';
dotenv.config();
import { enrich as enrichProc } from './procedimientosService';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'deepseek-coder-v2:latest';

let ollamaAvailable = false;

async function checkOllama(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    ollamaAvailable = res.ok;
  } catch {
    ollamaAvailable = false;
  }
  return ollamaAvailable;
}

checkOllama().then(available => {
  if (available) {
    console.log(`[AI Service] Ollama detectado en ${OLLAMA_URL} — usando motor LLM`);
  } else {
    console.log(`[AI Service] Ollama no disponible en ${OLLAMA_URL} — usando motor rule-based`);
  }
});

export const POINTS_MAP: Record<string, number[]> = {
  dificultad: [0, 40, 80, 120, 160, 200],
  supervision: [0, 30, 60, 90, 120, 150],
  responsabilidad: [0, 40, 80, 120, 160, 200],
  condiciones: [0, 20, 40, 60, 80, 100],
  error: [0, 30, 60, 90, 120, 150],
  requisitos: [0, 40, 80, 120, 160, 200]
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

export interface FactorKeywordDetail {
  factor: string;
  keywords: string[];
  procKeywords: string[];
  grado: number;
}

export interface AIEvaluationResult {
  success: boolean;
  data: EvaluationSuggestion;
  totalPuntos: number;
  puesto_id: string;
  analisis_completo: boolean;
  motor: 'llm' | 'rule-based';
  procedimientosCount?: number;
  factorKeywords?: FactorKeywordDetail[];
}

export function getEngineStatus(): { ollamaAvailable: boolean; activeEngine: 'llm' | 'rule-based' } {
  return { ollamaAvailable, activeEngine: ollamaAvailable ? 'llm' : 'rule-based' };
}

const FACTOR_NAMES: Record<string, string> = {
  dificultad: 'Dificultad de Funciones',
  supervision: 'Supervisión Ejercida',
  responsabilidad: 'Responsabilidad',
  condiciones: 'Condiciones de Trabajo',
  error: 'Consecuencia del Error',
  requisitos: 'Requisitos'
};

// ─── Rule-based evaluation engine ───────────────────────────

interface RuleKeyword {
  words: string[];
  score: number;
}

const RULES: Record<string, RuleKeyword[]> = {
  dificultad: [
    { words: ['barrer', 'limpiar', 'cargar', 'archivar', 'repetitivo', 'simple', 'manual'], score: 1 },
    { words: ['operativo', 'estandarizado', 'asistir', 'apoyar', 'tramitar', 'recibir', 'enviar'], score: 2 },
    { words: ['analizar', 'evaluar', 'resolver', 'técnico', 'diagnosticar', 'coordinar', 'preparar'], score: 3 },
    { words: ['planear', 'planificar', 'diseñar', 'implementar', 'proyecto', 'programa', 'departamento'], score: 4 },
    { words: ['estratégico', 'dirección', 'política', 'directriz', 'alcaldía', 'institución', 'rector'], score: 5 },
  ],
  supervision: [
    { words: ['no supervisa', 'sin personal', 'individual'], score: 1 },
    { words: ['supervisión ocasional', 'apoya en supervisión'], score: 2 },
    { words: ['supervisa', 'coordina equipo', 'grupo de trabajo', 'encargado'], score: 3 },
    { words: ['jefe', 'jefatura', 'unidad', 'departamento', 'dirige personal'], score: 4 },
    { words: ['dirección', 'gerencia', 'subdirección', 'área', 'director'], score: 5 },
  ],
  responsabilidad: [
    { words: ['baja responsabilidad', 'sin valores', 'herramientas básicas'], score: 1 },
    { words: ['materiales', 'equipo menor', 'herramientas'], score: 2 },
    { words: ['información sensible', 'confidencial', 'datos', 'fondos fijos', 'custodia'], score: 3 },
    { words: ['presupuesto', 'activos', 'valores', 'fondos', 'contratación'], score: 4 },
    { words: ['gestión total', 'proceso clave', 'patrimonio', 'institucional', 'estratégico'], score: 5 },
  ],
  condiciones: [
    { words: ['oficina', 'ambiente normal', 'escritorio', 'administrativo'], score: 1 },
    { words: ['esfuerzo físico moderado', 'ambiente incómodo', 'bipedestación'], score: 2 },
    { words: ['intemperie', 'clima', 'ruido', 'calor', 'vía pública', 'campo'], score: 3 },
    { words: ['riesgo', 'accidente', 'químicos', 'altura', 'maquinaria'], score: 4 },
    { words: ['alta peligrosidad', 'insalubridad', 'tóxico', 'peligro constante'], score: 5 },
  ],
  error: [
    { words: ['error fácil', 'fácil de detectar', 'corregir', 'sin impacto'], score: 1 },
    { words: ['retraso', 'demora', 'menor', 'interno'], score: 2 },
    { words: ['afecta', 'servicio', 'departamento', 'cliente', 'usuario'], score: 3 },
    { words: ['pérdida económica', 'legal', 'multa', 'sanción', 'significativo'], score: 4 },
    { words: ['estabilidad', 'seguridad pública', 'institucional', 'crítico', 'nacional'], score: 5 },
  ],
};

const REQUISITOS_RULES: { words: string[]; score: number }[] = [
  { words: ['primaria', 'básica', 'alfabeto'], score: 1 },
  { words: ['bachillerato', 'media', 'secundaria', 'técnico básico'], score: 2 },
  { words: ['diplomado', 'técnico superior', 'parauniversitario'], score: 3 },
  { words: ['licenciatura', 'universitario', 'bachillerato universitario', 'profesional'], score: 4 },
  { words: ['maestría', 'master', 'magíster', 'especialización', 'doctorado', 'phd'], score: 5 },
];

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreFromText(text: string, rules: RuleKeyword[]): { score: number; keywords: string[] } {
  const normalized = normalizeText(text);
  let maxScore = 1;
  const matched: string[] = [];

  for (const rule of rules) {
    for (const word of rule.words) {
      if (normalized.includes(word)) {
        if (rule.score > maxScore) maxScore = rule.score;
        matched.push(word);
      }
    }
  }

  if (text.length > 500) maxScore = Math.max(maxScore, 2);
  if (text.length > 1500) maxScore = Math.max(maxScore, 3);

  return { score: maxScore, keywords: [...new Set(matched)] };
}

function evaluateFactor(funciones: string, procText: string | undefined, rules: RuleKeyword[]): { grado: number; keywords: string[]; procKeywords: string[] } {
  const funcRes = scoreFromText(funciones, rules);
  if (!procText) return { grado: funcRes.score, keywords: funcRes.keywords, procKeywords: [] };

  const procRes = scoreFromText(procText, rules);
  const combined = Math.max(funcRes.score, procRes.score);

  return { grado: combined, keywords: funcRes.keywords, procKeywords: procRes.keywords };
}

function evaluateRequisitos(educacion: string): { grado: number; keyword: string } {
  const normalized = normalizeText(educacion);
  let maxScore = 1;
  let matched = 'educacion basica';

  for (const rule of REQUISITOS_RULES) {
    for (const word of rule.words) {
      if (normalized.includes(word)) {
        if (rule.score > maxScore) {
          maxScore = rule.score;
          matched = word;
        }
      }
    }
  }

  return { grado: maxScore, keyword: matched };
}

function generateJustification(factorKey: string, grado: number, keywords: string[], procKeywords: string[], puestoNombre: string, procCount?: number): string {
  let parts: string[] = [];

  if (keywords.length > 0) {
    parts.push(`La descripcion oficial del puesto "${puestoNombre}" contiene los terminos: ${keywords.slice(0, 3).join(', ')}`);
  }
  if (procKeywords.length > 0) {
    const src = procCount ? `${procCount} procedimientos asociados` : 'procedimientos asociados';
    parts.push(`en ${src} se identificaron: ${procKeywords.slice(0, 3).join(', ')}`);
  }

  if (parts.length > 0) {
    return `${parts.join(', ')}, lo cual corresponde a Grado ${grado} segun la rubrica MSC.`;
  }

  const defaultJustifications: Record<string, string[]> = {
    dificultad: ['Tareas basicas sin evidencia de mayor complejidad.', '', 'La extension y contenido de las funciones sugiere un nivel tecnico medio.', 'La descripcion incluye funciones de planificacion y coordinacion.', 'Se identifican funciones de direccion estrategica.'],
    supervision: ['No se encontro evidencia de personal a cargo.', '', 'Se mencionan labores de coordinacion.', 'El puesto incluye responsabilidades de jefatura.', 'El puesto tiene alcance directivo.'],
    responsabilidad: ['No se evidencia manejo de valores o informacion sensible.', '', 'Se menciona custodia o manejo de datos.', 'El puesto maneja presupuestos o activos.', 'Responsabilidad total sobre procesos clave.'],
    condiciones: ['Ambiente de oficina segun las funciones descritas.', '', 'Se mencionan condiciones de campo o esfuerzo fisico.', 'Exposicion a riesgos laborales.', 'Condiciones de alta peligrosidad.'],
    error: ['Errores de bajo impacto institucional.', '', 'El error afectaria el servicio.', 'El error causaria perdidas economicas o legales.', 'El error comprometeria la estabilidad institucional.'],
    requisitos: ['Educacion basica requerida.', 'Bachillerato o tecnico basico.', 'Diplomado o tecnico superior.', 'Licenciatura o nivel universitario.', 'Maestria o especializacion avanzada.']
  };
  return defaultJustifications[factorKey]?.[grado - 1] || `Asignado Grado ${grado} segun analisis de las funciones del puesto "${puestoNombre}".`;
}

function ruleBasedEvaluation(puesto: any, procText?: string): AIEvaluationResult {
  const funciones = puesto.descripcion_funciones || '';
  const educacion = puesto.educacion_requerida || '';
  const puestoNombre = puesto.nombre || '';
  const procCount = procText ? procText.split('---').filter(s => s.includes(':')).length : 0;

  const factors: (keyof EvaluationSuggestion)[] = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error'];

  const result: any = {};
  const factorKeywords: FactorKeywordDetail[] = [];

  for (const factor of factors) {
    const { grado, keywords, procKeywords } = evaluateFactor(funciones, procText, RULES[factor]);
    result[factor] = grado;
    result[`${factor}_just`] = generateJustification(factor, grado, keywords, procKeywords, puestoNombre, procCount || undefined);
    factorKeywords.push({ factor, keywords, procKeywords, grado });
  }

  const { grado: reqGrado, keyword: reqKeyword } = evaluateRequisitos(educacion);
  result.requisitos = reqGrado;
  result.requisitos_just = reqKeyword
    ? `El requisito de "${reqKeyword}" en la descripcion del puesto corresponde a Grado ${reqGrado} segun la escala de formacion academica MSC.`
    : generateJustification('requisitos', reqGrado, [], [], puestoNombre);

  const evaluated = validateAndCalculate(result, puesto.id, 'rule-based');
  evaluated.factorKeywords = factorKeywords;
  if (procCount) evaluated.procedimientosCount = procCount;
  return evaluated;
}

// ─── LLM engine ─────────────────────────────────────────────

function sanitizeInput(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function buildPrompt(puesto: any): string {
  const gradeTable = Object.entries({
    dificultad: [
      'Grado 1 (0 pts): Tareas simples y repetitivas, poca iniciativa.',
      'Grado 2 (40 pts): Tareas variadas pero estandarizadas.',
      'Grado 3 (80 pts): Requiere analisis y juicio para resolver problemas tecnicos.',
      'Grado 4 (120 pts): Alta complejidad, planeacion y coordinacion institucional.',
      'Grado 5 (160 pts): Direccion estrategica y toma de decisiones criticas.'
    ],
    supervision: [
      'Grado 1 (0 pts): No ejerce supervision.',
      'Grado 2 (30 pts): Supervision ocasional de tareas simples.',
      'Grado 3 (60 pts): Supervision de un grupo de trabajo operativo.',
      'Grado 4 (90 pts): Jefatura de una unidad o departamento.',
      'Grado 5 (120 pts): Direccion de un area tecnica o administrativa mayor.'
    ],
    responsabilidad: [
      'Grado 1 (0 pts): Baja responsabilidad por valores o equipo.',
      'Grado 2 (40 pts): Responsabilidad moderada por materiales y herramientas.',
      'Grado 3 (80 pts): Custodia de informacion sensible o fondos fijos.',
      'Grado 4 (120 pts): Responsabilidad por presupuestos o activos de alto valor.',
      'Grado 5 (160 pts): Responsabilidad total por la gestion de un proceso clave.'
    ],
    condiciones: [
      'Grado 1 (0 pts): Ambiente de oficina normal, riesgos minimos.',
      'Grado 2 (20 pts): Esfuerzo fisico moderado o ambiente algo incomodo.',
      'Grado 3 (40 pts): Exposicion a condiciones climaticas o ruido constante.',
      'Grado 4 (60 pts): Riesgo de accidentes laborales o manejo de quimicos.',
      'Grado 5 (80 pts): Condiciones de alta peligrosidad o insalubridad constante.'
    ],
    error: [
      'Grado 1 (0 pts): Error facil de detectar y corregir.',
      'Grado 2 (30 pts): Error causa retrasos menores en el flujo de trabajo.',
      'Grado 3 (60 pts): Error afecta a otros departamentos o al servicio al cliente.',
      'Grado 4 (90 pts): Error causa perdidas economicas o legales significativas.',
      'Grado 5 (120 pts): Error compromete la estabilidad institucional o seguridad publica.'
    ],
    requisitos: [
      'Grado 1 (0 pts): Educacion basica o primaria.',
      'Grado 2 (40 pts): Bachillerato en Educacion Media o Tecnico basico.',
      'Grado 3 (80 pts): Diplomado o Tecnico superior especializado.',
      'Grado 4 (120 pts): Bachillerato Universitario o Licenciatura profesional.',
      'Grado 5 (160 pts): Grado de Maestria o especializacion avanzada requerida.'
    ]
  }).map(([factor, grades]) => `${FACTOR_NAMES[factor] || factor}:\n${grades.map(g => `  ${g}`).join('\n')}`).join('\n\n');

  return `
Eres el EVALUADOR TECNICO OFICIAL del sistema de valoracion de puestos de la Municipalidad de San Carlos.
Tu analisis es objetivo, vinculante y constituye un documento oficial con implicaciones administrativas y legales.
Debes basarte EXCLUSIVAMENTE en la descripcion de funciones y requisitos del puesto, aplicando la metodologia MSC (Manual de Clases) de Puntos por Factores con rigor tecnico y profesional.

=== DATOS DEL PUESTO A EVALUAR ===
Nombre del puesto: ${sanitizeInput(puesto.nombre) || 'No especificado'}
Area/Departamento: ${sanitizeInput(puesto.area) || 'General'}
Reporta a: ${sanitizeInput(puesto.reporta_a) || 'No especificado'}

=== DESCRIPCION DE FUNCIONES ===
${sanitizeInput(puesto.descripcion_funciones) || 'No especificadas'}

=== REQUISITOS DEL PUESTO ===
Educacion requerida: ${sanitizeInput(puesto.educacion_requerida) || 'No especificada'}
Experiencia requerida: ${sanitizeInput(puesto.experiencia_requerida) || 'No especificada'}

=== ESCALA DE GRADOS POR FACTOR ===
Cada factor se califica del 1 (minimo) al 5 (maximo).

${gradeTable}

=== METODOLOGIA DE ANALISIS TECNICO ===
Para CADA factor, realiza un analisis multidimensional:

1. **Naturaleza del trabajo**: Evalua la complejidad intrinseca de las funciones descritas. Considera si las tareas son operativas, tecnicas, analiticas, de coordinacion, de planificacion o estrategicas. No te limites a buscar palabras clave; evalua el nivel de juicio, iniciativa y autonomia requerido.

2. **Contexto organizacional**: Considera la ubicacion del puesto en la estructura (a quien reporta, que areas coordina) y su impacto en los procesos institucionales. Evalua el alcance de sus decisiones y responsabilidades.

3. **Evidencia textual especifica**: Identifica y CITA textualmente las partes de la descripcion que demuestren el nivel del factor. La justificacion debe hacer referencia directa a fragmentos de las funciones.

4. **Asignacion del grado**: Selecciona el grado que MEJOR refleje la totalidad de la evidencia. Si hay elementos de multiples grados, prevalece el nivel predominante descrito. Cada grado debe estar plenamente justificado con evidencia textual.

=== INSTRUCCIONES CRITICAS ===
- Este informe tiene CARACTER VINCULANTE y puede ser usado en procesos administrativos, recursos de revision y reclamaciones legales. Actua con la maxima responsabilidad tecnica.
- Cada grado debe ser un numero entero entre 1 y 5.
- Cada justificacion debe tener entre 2 y 4 oraciones, citando fragmentos especificos de las funciones en comillas.
- No justifiques con palabras sueltas; explica POR QUE ese fragmento demuestra el nivel asignado.
- Si no hay evidencia clara, asigna el grado mas conservador (1).
- Devuelve UNICAMENTE el objeto JSON, sin texto adicional ni codigo.

=== EJEMPLO DE JUSTIFICACION TECNICA ADECUADA ===
"dificultad_just": "Las funciones describen que el puesto 'analiza y evalua informacion tecnica para la toma de decisiones departamentales', lo cual evidencia un nivel de analisis y juicio profesional (Grado 3). Adicionalmente, se menciona 'coordina la ejecucion de programas operativos', lo que requiere planificacion de alcance medio. No se identifican funciones de diseno estrategico o direccion institucional que justifiquen un nivel superior."

=== FORMATO JSON REQUERIDO ===
{ "dificultad": <1-5>, "dificultad_just": "<justificacion tecnica>", "supervision": <1-5>, "supervision_just": "<justificacion tecnica>", "responsabilidad": <1-5>, "responsabilidad_just": "<justificacion tecnica>", "condiciones": <1-5>, "condiciones_just": "<justificacion tecnica>", "error": <1-5>, "error_just": "<justificacion tecnica>", "requisitos": <1-5>, "requisitos_just": "<justificacion tecnica>" }
`;
}

function validateAndCalculate(suggestion: any, puesto_id: string, motor: 'llm' | 'rule-based' = 'llm'): AIEvaluationResult {
  const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];
  const errors: string[] = [];

  for (const factor of FACTORS) {
    const grado = Number(suggestion[factor]);
    if (!Number.isInteger(grado) || grado < 1 || grado > 5) {
      errors.push(`${factor}: debe ser entero entre 1 y 5, recibio ${suggestion[factor]}`);
      suggestion[factor] = 1;
    }
    const justKey = `${factor}_just`;
    if (!suggestion[justKey] || typeof suggestion[justKey] !== 'string' || suggestion[justKey].trim().length < 5) {
      errors.push(`${justKey}: justificacion muy corta o vacia`);
      suggestion[justKey] = suggestion[justKey] || 'Analisis basado en la descripcion de funciones del puesto.';
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
    analisis_completo: errors.length === 0,
    motor
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
    getEngineStatus,

    async evaluate(puesto: any): Promise<AIEvaluationResult> {
        const procCtx = await enrichProc(puesto).catch(() => null);
        const procText = procCtx ? procCtx.textoCompleto : undefined;
        let result: AIEvaluationResult;
        if (ollamaAvailable) {
          try {
            const enrichedPuesto = procText
              ? { ...puesto, descripcion_funciones: `${puesto.descripcion_funciones}\n\n--- PROCEDIMIENTOS ASOCIADOS ---\n${procText}` }
              : puesto;
            const prompt = buildPrompt(enrichedPuesto);
            const raw = await callOllama(prompt);
            result = validateAndCalculate(raw, puesto.id, 'llm');
          } catch (error: any) {
            console.warn('[AI Service] Error en LLM, cayendo a rule-based:', error.message);
            result = ruleBasedEvaluation(puesto, procText);
          }
        } else {
          result = ruleBasedEvaluation(puesto, procText);
        }
        if (procCtx) result.procedimientosCount = procCtx.totalProcedimientos;
        return result;
    },

    async suggestEvaluation(puesto: any): Promise<EvaluationSuggestion | null> {
        const procCtx = await enrichProc(puesto).catch(() => null);
        const procText = procCtx ? procCtx.textoCompleto : undefined;
        if (!ollamaAvailable) {
          const result = ruleBasedEvaluation(puesto, procText);
          return result.data;
        }

        try {
            const enrichedPuesto = procText
              ? { ...puesto, descripcion_funciones: `${puesto.descripcion_funciones}\n\n--- PROCEDIMIENTOS ASOCIADOS ---\n${procText}` }
              : puesto;
            const prompt = buildPrompt(enrichedPuesto);
            const raw = await callOllama(prompt);
            return raw as EvaluationSuggestion;
        } catch (error: any) {
            console.warn('[AI Service] Error en suggestEvaluation, usando rule-based:', error.message);
            const result = ruleBasedEvaluation(puesto, procText);
            return result.data;
        }
    }
};
