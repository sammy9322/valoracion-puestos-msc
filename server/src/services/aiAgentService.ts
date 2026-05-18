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

// ─── Rule-based evaluation engine (multi-dimensional) ───────

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tokenize text into sentences for structural analysis */
function getSentences(text: string): string[] {
  return (text || '')
    .split(/[.!;\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

/** Categorize verbs by complexity level */
const VERB_LEVELS: Record<number, string[]> = {
  1: ['barrer', 'limpiar', 'cargar', 'archivar', 'ordenar', 'etiquetar', 'copiar', 'escane', 'fotocopiar', 'doblar', 'empacar'],
  2: ['operar', 'asistir', 'apoyar', 'tramitar', 'recibir', 'enviar', 'registrar', 'actualizar', 'ingresar', 'transcribir', 'atender', 'levantar', 'llenar'],
  3: ['analizar', 'evaluar', 'resolver', 'diagnosticar', 'coordinar', 'preparar', 'supervisar', 'monitorear', 'elaborar', 'revisar', 'verificar', 'inspeccionar', 'concertar'],
  4: ['planificar', 'planear', 'disenar', 'implementar', 'dirigir', 'organizar', 'programar', 'establecer', 'desarrollar', 'proponer', 'administrar', 'gestionar'],
  5: ['formular', 'definir', 'liderar', 'conducir', 'dictar', 'aprobar', 'autorizar', 'normar', 'reglamentar', 'estratég'],
};

/** Scope indicators — what level the work affects */
const SCOPE_INDICATORS: Record<number, string[]> = {
  1: ['tarea', 'actividad', 'elemento', 'archivo', 'documento individual'],
  2: ['procedimiento', 'proceso', 'tramite', 'expediente', 'caso'],
  3: ['programa', 'proyecto', 'servicio', 'departamento', 'unidad'],
  4: ['direccion', 'gerencia', 'division', 'institucion', 'municipalidad'],
  5: ['politica', 'estrategia', 'rector', 'normativa', 'ley', 'reglamento', 'alcance nacional'],
};

/** Hierarchy indicators for supervision factor */
const HIERARCHY_INDICATORS: Record<number, { patterns: string[]; weight: number }> = {
  1: { patterns: ['sin personal a cargo', 'no supervisa', 'trabajo individual', 'funciones individuales', 'no tiene personal', 'personal a cargo no', 'sin supervision', 'tareas individuales'], weight: 2 },
  2: { patterns: ['supervision ocasional', 'apoya supervision', 'coordina actividades', 'guia a companeros', 'colabora con equipo'], weight: 1.5 },
  3: { patterns: ['coordina equipo', 'grupo de trabajo', 'encargado de grupo', 'supervisa personal', 'supervisa equipo', 'lidera grupo'], weight: 1.5 },
  4: { patterns: ['jefe', 'jefatura', 'unidad', 'departamento', 'dirige personal', 'encargado de departamento', 'responsable de area', 'coordinador general'], weight: 1.5 },
  5: { patterns: ['direccion', 'gerencia', 'subdireccion', 'director', 'gerente', 'subdirector', 'alta gerencia'], weight: 1.5 },
};

/** Responsibility scope indicators */
const RESP_SCOPE: Record<number, { patterns: string[]; weight: number }> = {
  1: { patterns: ['herramientas basicas', 'equipo basico', 'material de oficina', 'papeleria', 'baja responsabilidad'], weight: 1 },
  2: { patterns: ['materiales', 'equipo menor', 'herramientas', 'activos menores', 'suministros', 'inventario basico'], weight: 1 },
  3: { patterns: ['informacion sensible', 'confidencial', 'datos personales', 'fondos fijos', 'custodia', 'valores menores', 'documentacion reservada'], weight: 1.5 },
  4: { patterns: ['presupuesto', 'activos', 'fondos', 'contratacion', 'recursos financieros', 'patrimonio municipal', 'licitacion', 'compras mayores'], weight: 1.5 },
  5: { patterns: ['gestion total', 'proceso clave', 'decision estratégico', 'politica institucional', 'alto impacto', 'recursos institucionales'], weight: 2 },
};

/** Work conditions indicators */
const COND_INDICATORS: Record<number, { patterns: string[]; weight: number }> = {
  1: { patterns: ['oficina', 'ambiente normal', 'escritorio', 'administrativo', 'ambiente controlado', 'trabajo sedentario'], weight: 1 },
  2: { patterns: ['esfuerzo fisico moderado', 'ambiente incomodo', 'bipedestacion', 'de pie', 'camina frecuentemente', 'levanta peso moderado'], weight: 1 },
  3: { patterns: ['intemperie', 'clima', 'ruido', 'calor', 'via publica', 'campo', 'exterior', 'caminando largas distancias', 'ambiente variable'], weight: 1.5 },
  4: { patterns: ['riesgo', 'accidente', 'quimicos', 'altura', 'maquinaria', 'sustancias', 'equipo peligroso', 'trabajo en altura'], weight: 1.5 },
  5: { patterns: ['alta peligrosidad', 'insalubridad', 'toxicos', 'peligro constante', 'enfermedad profesional', 'ambiente extremo', 'radiacion'], weight: 2 },
};

/** Error impact indicators */
const ERROR_IMPACT: Record<number, { patterns: string[]; weight: number }> = {
  1: { patterns: ['error facil', 'facil de detectar', 'corregir', 'sin impacto', 'bajo impacto', 'minimo efecto'], weight: 1 },
  2: { patterns: ['retraso', 'demora', 'menor', 'interno', 'proceso interno', 'reasignacion'], weight: 1 },
  3: { patterns: ['afecta servicio', 'departamento', 'cliente', 'usuario', 'ciudadano', 'externo', 'interrumpe'], weight: 1.5 },
  4: { patterns: ['perdida economica', 'perdida financiera', 'legal', 'multa', 'sancion', 'significativo', 'demanda', 'penal'], weight: 1.5 },
  5: { patterns: ['estabilidad', 'seguridad publica', 'institucional', 'critico', 'nacional', 'reputacion', 'crisis', 'confianza publica', 'irreversible'], weight: 2 },
};

const EDUC_LEVELS: { patterns: string[]; score: number; label: string }[] = [
  { patterns: ['primaria', 'basica', 'alfabeto', 'no requiere'], score: 1, label: 'educacion basica' },
  { patterns: ['bachillerato', 'media', 'secundaria', 'tecnico basico', 'educacion diversificada'], score: 2, label: 'bachillerato' },
  { patterns: ['diplomado', 'tecnico superior', 'parauniversitario', 'tecnico medio'], score: 3, label: 'tecnico superior' },
  { patterns: ['licenciatura', 'universitario', 'bachillerato universitario', 'profesional', 'grado universitario'], score: 4, label: 'licenciatura' },
  { patterns: ['maestria', 'master', 'magister', 'especializacion', 'doctorado', 'phd', 'posgrado'], score: 5, label: 'maestria/doctorado' },
];

// ─── Dimensional analysis helpers ────────────────────────────

interface DimensionScore {
  score: number;
  evidence: string[];
}

function scoreByLevels(
  text: string,
  levels: Record<number, { patterns: string[]; weight: number }>,
  baseScore: number = 1,
): DimensionScore {
  const normalized = normalizeText(text);
  let maxScore = baseScore;
  const matchedEvidence: string[] = [];

  for (let grade = 1; grade <= 5; grade++) {
    const level = levels[grade];
    if (!level) continue;    
    for (const pattern of level.patterns) {
      if (normalized.includes(pattern)) {
        const effective = grade * level.weight;
        if (effective > maxScore) maxScore = effective;
        matchedEvidence.push(pattern);
      }
    }
  }

  const finalGrade = Math.min(5, Math.round(maxScore));
  return { score: finalGrade, evidence: [...new Set(matchedEvidence)].slice(0, 5) };
}

function scoreByVerbs(text: string): DimensionScore {
  const normalized = normalizeText(text);
  let maxVerbScore = 1;
  const found: string[] = [];

  for (let level = 1; level <= 5; level++) {
    const verbs = VERB_LEVELS[level];
    for (const verb of verbs) {
      if (normalized.includes(verb)) {
        if (level > maxVerbScore) maxVerbScore = level;
        found.push(verb);
      }
    }
  }

  return { score: maxVerbScore, evidence: [...new Set(found)].slice(0, 5) };
}

function scoreByScope(text: string): DimensionScore {
  const normalized = normalizeText(text);
  let maxScope = 1;
  const found: string[] = [];

  for (let level = 1; level <= 5; level++) {
    const terms = SCOPE_INDICATORS[level];
    for (const term of terms) {
      if (normalized.includes(term)) {
        if (level > maxScope) maxScope = level;
        found.push(term);
      }
    }
  }

  return { score: maxScope, evidence: [...new Set(found)].slice(0, 5) };
}

function scoreByStructure(text: string): number {
  const sentences = getSentences(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  let score = 1;

  if (wordCount > 800) score = Math.max(score, 3);
  else if (wordCount > 400) score = Math.max(score, 2);

  if (sentences.length >= 6) score = Math.max(score, 2);
  if (sentences.length >= 12) score = Math.max(score, 3);

  const hasBullets = (text.match(/- /g) || []).length >= 3;
  if (hasBullets && wordCount > 300) score = Math.max(score, 3);

  const hasMultipleSections = sentences.filter(s => s.length > 80).length >= 3;
  if (hasMultipleSections) score = Math.max(score, 2);

  return Math.min(5, score);
}

function scoreRequisitos(educacion: string): { grado: number; keyword: string; evidence: string } {
  const normalized = normalizeText(educacion);
  let maxScore = 1;
  let matched = 'educacion basica';

  for (const level of EDUC_LEVELS) {
    for (const pattern of level.patterns) {
      if (normalized.includes(pattern)) {
        if (level.score > maxScore) {
          maxScore = level.score;
          matched = level.label;
        }
      }
    }
  }

  return { grado: maxScore, keyword: matched, evidence: matched };
}

// ─── Factor-specific evaluators ──────────────────────────────

function evaluateDificultad(text: string): { grado: number; keywords: string[]; justification: string } {
  const verbDim = scoreByVerbs(text);
  const scopeDim = scoreByScope(text);
  const structDim = scoreByStructure(text);
  const kwDim = scoreByLevels(text, {
    1: { patterns: ['simple', 'repetitivo', 'manual', 'rutina', 'elemental'], weight: 1 },
    2: { patterns: ['operativo', 'estandarizado', 'asistir', 'apoyar', 'tramitar', 'programado'], weight: 1 },
    3: { patterns: ['tecnico', 'analisis', 'diagnostico', 'evaluacion', 'resolucion', 'coordinacion'], weight: 1.2 },
    4: { patterns: ['planificacion', 'planeamiento', 'programa', 'proyecto', 'diseño', 'implementacion'], weight: 1.3 },
    5: { patterns: ['estrategico', 'direccion', 'politica', 'directriz', 'institucion', 'rector'], weight: 1.5 },
  });

  const rawScore = Math.round(
    0.35 * verbDim.score +
    0.30 * scopeDim.score +
    0.10 * structDim +
    0.25 * kwDim.score
  );

  const grado = Math.max(1, Math.min(5, Math.round(rawScore)));

  const verbEvidence = verbDim.evidence.slice(0, 2);
  const scopeEvidence = scopeDim.evidence.slice(0, 2);
  const allKeywords = [...verbEvidence, ...scopeEvidence, ...kwDim.evidence];
  const uniqueKeywords = [...new Set(allKeywords)];

  let just = `Analisis de dificultad: `;
  if (verbEvidence.length > 0) just += `las funciones utilizan verbos como "${verbEvidence.join(', ')}" `;
  if (scopeEvidence.length > 0) just += `y el alcance del trabajo abarca "${scopeEvidence.join(', ')}". `;
  just += `La descripcion tiene una extension de ${text.split(/\s+/).filter(Boolean).length} palabras con ${getSentences(text).length} ideas distintas. `;
  just += `En conjunto, la evidencia corresponde a un nivel de complejidad Grado ${grado} segun la rubrica MSC.`;

  return { grado, keywords: uniqueKeywords, justification: just };
}

function evaluateSupervision(text: string): { grado: number; keywords: string[]; justification: string } {
  const hierarchyDim = scoreByLevels(text, HIERARCHY_INDICATORS, 1);
  const verbDim = scoreByVerbs(text);

  let rawScore = Math.round(0.6 * hierarchyDim.score + 0.4 * verbDim.score);
  if (rawScore < 1) rawScore = 1;
  const grado = Math.max(1, Math.min(5, rawScore));

  const ev = hierarchyDim.evidence;

  let just = `Analisis de supervision: `;
  if (ev.length > 0) {
    just += `Se identificaron indicadores de supervision: "${ev.slice(0, 3).join(', ')}". `;
  } else {
    just += `No se encontraron indicadores de personal a cargo en la descripcion de funciones. `;
  }
  just += `Con base en la evidencia, el nivel de supervision corresponde a Grado ${grado} segun la rubrica MSC.`;

  return { grado, keywords: ev, justification: just };
}

function evaluateResponsabilidad(text: string): { grado: number; keywords: string[]; justification: string } {
  const respDim = scoreByLevels(text, RESP_SCOPE, 1);
  const scopeDim = scoreByScope(text);

  let rawScore = Math.round(0.6 * respDim.score + 0.4 * scopeDim.score);
  if (rawScore < 1) rawScore = 1;
  const grado = Math.max(1, Math.min(5, rawScore));

  const ev = respDim.evidence;

  let just = `Analisis de responsabilidad: `;
  if (ev.length > 0) {
    just += `El puesto describe responsabilidades sobre "${ev.slice(0, 3).join(', ')}". `;
  } else {
    just += `No se describen responsabilidades especificas sobre valores, informacion o activos. `;
  }
  just += `El nivel de responsabilidad corresponde a Grado ${grado} segun la rubrica MSC.`;

  return { grado, keywords: ev, justification: just };
}

function evaluateCondiciones(text: string): { grado: number; keywords: string[]; justification: string } {
  const condDim = scoreByLevels(text, COND_INDICATORS, 1);

  let rawScore = condDim.score;
  if (rawScore < 1) rawScore = 1;
  const grado = Math.max(1, Math.min(5, rawScore));

  const ev = condDim.evidence;

  let just = `Analisis de condiciones de trabajo: `;
  if (ev.length > 0) {
    just += `Se describen condiciones como "${ev.slice(0, 3).join(', ')}". `;
  } else {
    just += `Las funciones se desarrollan en condiciones tipicas de oficina. `;
  }
  just += `El nivel de exposicion corresponde a Grado ${grado} segun la rubrica MSC.`;

  return { grado, keywords: ev, justification: just };
}

function evaluateError(text: string): { grado: number; keywords: string[]; justification: string } {
  const errDim = scoreByLevels(text, ERROR_IMPACT, 1);

  let rawScore = errDim.score;
  if (rawScore < 1) rawScore = 1;
  const grado = Math.max(1, Math.min(5, rawScore));

  const ev = errDim.evidence;

  let just = `Analisis de consecuencia del error: `;
  if (ev.length > 0) {
    just += `El impacto de un error se describe como "${ev.slice(0, 3).join(', ')}". `;
  } else {
    just += `No se describe explicitamente el impacto de errores en las funciones. `;
  }
  just += `La consecuencia del error corresponde a Grado ${grado} segun la rubrica MSC.`;

  return { grado, keywords: ev, justification: just };
}

function ruleBasedEvaluation(puesto: any, procText?: string): AIEvaluationResult {
  const funciones = puesto.descripcion_funciones || '';
  const educacion = puesto.educacion_requerida || '';
  const puestoNombre = puesto.nombre || '';
  const procCount = procText ? procText.split('---').filter(s => s.includes(':')).length : 0;

  const evaluators = [
    { key: 'dificultad' as const, fn: evaluateDificultad },
    { key: 'supervision' as const, fn: evaluateSupervision },
    { key: 'responsabilidad' as const, fn: evaluateResponsabilidad },
    { key: 'condiciones' as const, fn: evaluateCondiciones },
    { key: 'error' as const, fn: evaluateError },
  ];

  const result: any = {};
  const factorKeywords: FactorKeywordDetail[] = [];

  for (const { key, fn } of evaluators) {
    const funcRes = fn(funciones);
    result[key] = funcRes.grado;
    result[`${key}_just`] = funcRes.justification;

    let procKeywords: string[] = [];
    if (procText) {
      const procRes = fn(procText);
      if (procRes.grado > funcRes.grado) {
        result[key] = Math.min(5, funcRes.grado + Math.round((procRes.grado - funcRes.grado) * 0.5));
        procKeywords = procRes.keywords;
      }
    }

    factorKeywords.push({ factor: key, keywords: funcRes.keywords, procKeywords, grado: result[key] });
  }

  const { grado: reqGrado, evidence: reqEvidence } = scoreRequisitos(educacion);
  result.requisitos = reqGrado;
  result.requisitos_just = reqEvidence && reqEvidence !== 'educacion basica'
    ? `Analisis de requisitos: el puesto requiere "${reqEvidence}", lo cual corresponde a Grado ${reqGrado} segun la escala de formacion academica MSC.`
    : `Analisis de requisitos: se requiere "${reqEvidence}", asignando Grado ${reqGrado} segun la rubrica MSC.`;

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
