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

// ─── Rubric Coverage Engine ──────────────────────────────────

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSentences(text: string): string[] {
  return (text || '')
    .split(/[.!;\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

interface GradeIndicator {
  patterns: string[];
  weight: number;
  desc: string;
  contextExclude?: string[];
}

interface GradeProfile {
  grade: number;
  indicators: GradeIndicator[];
  desc: string;
}

interface RubricScore {
  grade: number;
  coverage: number[];
  gradedCoverage: number[];
  matched: Record<number, string[]>;
}

const DIFICULTAD_PROFILES: GradeProfile[] = [
  { grade: 1, desc: 'Tareas simples y repetitivas', indicators: [
    { patterns: ['barrer', 'limpiar', 'cargar', 'archivar', 'ordenar', 'copiar', 'etiquetar', 'fotocopiar', 'doblar', 'empacar'], weight: 2, desc: 'verbos operativos basicos' },
    { patterns: ['tarea', 'elemento', 'archivo', 'documento'], weight: 2, desc: 'alcance de tarea individual' },
    { patterns: ['simple', 'repetitivo', 'manual', 'rutina', 'elemental'], weight: 1, desc: 'patron de simplicidad' },
  ]},
  { grade: 2, desc: 'Tareas variadas estandarizadas', indicators: [
    { patterns: ['operar', 'asistir', 'apoyar', 'tramitar', 'recibir', 'enviar', 'registrar', 'atender', 'levantar', 'llenar'], weight: 2, desc: 'verbos de ejecucion' },
    { patterns: ['procedimiento', 'tramite', 'expediente', 'caso', 'turno'], weight: 2, desc: 'alcance de procedimiento' },
    { patterns: ['operativo', 'estandarizado', 'programado'], weight: 1, desc: 'patron de estandarizacion' },
  ]},
  { grade: 3, desc: 'Analisis y juicio tecnico', indicators: [
    { patterns: ['analizar', 'evaluar', 'resolver', 'diagnosticar', 'preparar', 'monitorear', 'elaborar', 'revisar', 'verificar', 'inspeccionar'], weight: 2, desc: 'verbos de analisis' },
    { patterns: ['programa', 'proyecto', 'servicio'], weight: 2, desc: 'alcance de programa/proyecto' },
    { patterns: ['tecnico', 'analisis', 'diagnostico', 'coordinacion'], weight: 1, desc: 'patron de complejidad tecnica',
      contextExclude: ['comite', 'mesa', 'reunion', 'asistencia', 'apoyo'] },
    { patterns: ['evaluacion', 'resolucion'], weight: 1, desc: 'patron de evaluacion',
      contextExclude: ['desempeno', 'rendimiento', 'personal', 'clima laboral'] },
  ]},
  { grade: 4, desc: 'Alta complejidad y planeacion', indicators: [
    { patterns: ['planificar', 'planear', 'disenar', 'implementar', 'organizar', 'programar', 'establecer', 'desarrollar', 'proponer', 'administrar', 'gestionar'], weight: 2, desc: 'verbos de planificacion' },
    { patterns: ['departamento', 'unidad', 'direccion', 'gerencia'], weight: 2, desc: 'alcance de unidad/departamento' },
    { patterns: ['planificacion', 'planeamiento', 'diseño', 'implementacion', 'coordinacion general'], weight: 1, desc: 'patron de planeacion' },
  ]},
  { grade: 5, desc: 'Direccion estrategica', indicators: [
    { patterns: ['formular', 'definir', 'liderar', 'conducir', 'dictar', 'aprobar', 'autorizar', 'normar', 'reglamentar'], weight: 2, desc: 'verbos directivos' },
    { patterns: ['institucion', 'municipalidad', 'alcance nacional'], weight: 2, desc: 'alcance institucional' },
    { patterns: ['estrategico', 'politica', 'directriz', 'rector', 'reglamento', 'ley', 'normativa'], weight: 1.5, desc: 'patron estrategico' },
  ]},
];

const SUPERVISION_PROFILES: GradeProfile[] = [
  { grade: 1, desc: 'No ejerce supervision', indicators: [
    { patterns: ['sin personal', 'no supervisa', 'trabajo individual', 'no tiene personal', 'personal a cargo no', 'funciones individuales', 'tareas individuales'], weight: 2, desc: 'ausencia de personal a cargo' },
  ]},
  { grade: 2, desc: 'Supervision ocasional', indicators: [
    { patterns: ['supervision ocasional', 'apoya supervision', 'guia a compañeros', 'colabora con equipo'], weight: 2, desc: 'supervision eventual' },
    { patterns: ['coordina actividades', 'coordina tareas', 'coordina procesos'], weight: 1.5, desc: 'coordinacion de tareas' },
  ]},
  { grade: 3, desc: 'Supervision de grupo operativo', indicators: [
    { patterns: ['coordina equipo', 'grupo de trabajo', 'encargado de grupo', 'supervisa personal', 'supervisa equipo', 'lidera grupo'], weight: 2, desc: 'jefatura de grupo' },
    { patterns: ['responsable de equipo', 'lider de grupo', 'capataz', 'supervisor'], weight: 1.5, desc: 'cargo de supervision directa' },
  ]},
  { grade: 4, desc: 'Jefatura de unidad', indicators: [
    { patterns: ['jefe', 'jefatura', 'unidad', 'departamento', 'dirige personal', 'encargado de departamento', 'responsable de area', 'coordinador general'], weight: 2, desc: 'jefatura formal' },
  ]},
  { grade: 5, desc: 'Direccion de area mayor', indicators: [
    { patterns: ['direccion', 'gerencia', 'subdireccion', 'director', 'gerente', 'subdirector', 'alta gerencia'], weight: 2, desc: 'cargo directivo' },
  ]},
];

const RESP_PROFILES: GradeProfile[] = [
  { grade: 1, desc: 'Baja responsabilidad', indicators: [
    { patterns: ['baja responsabilidad', 'herramientas basicas', 'equipo basico', 'material de oficina', 'papeleria'], weight: 2, desc: 'responsabilidad minima' },
  ]},
  { grade: 2, desc: 'Responsabilidad moderada', indicators: [
    { patterns: ['materiales', 'equipo menor', 'herramientas', 'activos menores', 'suministros', 'inventario basico'], weight: 2, desc: 'activos menores' },
  ]},
  { grade: 3, desc: 'Custodia de informacion sensible', indicators: [
    { patterns: ['informacion sensible', 'confidencial', 'datos personales', 'fondos fijos', 'custodia', 'valores menores', 'documentacion reservada'], weight: 2, desc: 'informacion o valores sensibles' },
  ]},
  { grade: 4, desc: 'Responsabilidad por presupuestos', indicators: [
    { patterns: ['presupuesto', 'activos', 'fondos', 'contratacion', 'recursos financieros', 'patrimonio municipal', 'licitacion', 'compras mayores'], weight: 2, desc: 'gestion de recursos financieros' },
  ]},
  { grade: 5, desc: 'Gestion de proceso clave', indicators: [
    { patterns: ['gestion total', 'proceso clave', 'decision estrategico', 'politica institucional', 'alto impacto', 'recursos institucionales', 'patrimonio'], weight: 2, desc: 'responsabilidad institucional' },
  ]},
];

const COND_PROFILES: GradeProfile[] = [
  { grade: 1, desc: 'Oficina normal', indicators: [
    { patterns: ['oficina', 'escritorio', 'ambiente controlado', 'trabajo sedentario'], weight: 1, desc: 'trabajo en ambiente controlado' },
  ]},
  { grade: 2, desc: 'Esfuerzo fisico moderado', indicators: [
    { patterns: ['esfuerzo fisico moderado', 'ambiente incomodo', 'bipedestacion', 'de pie', 'camina frecuentemente', 'levanta peso moderado'], weight: 1.5, desc: 'esfuerzo fisico ocasional' },
  ]},
  { grade: 3, desc: 'Exposicion a condiciones climaticas', indicators: [
    { patterns: ['intemperie', 'clima', 'ruido constante', 'calor', 'via publica', 'campo', 'exterior', 'ambiente variable'], weight: 1.5, desc: 'exposicion ambiental' },
  ]},
  { grade: 4, desc: 'Riesgo de accidentes', indicators: [
    { patterns: ['riesgo', 'accidente', 'altura', 'maquinaria', 'sustancias', 'quimicos'], weight: 2, desc: 'riesgo laboral',
      contextExclude: ['control interno', 'metodologia', 'valoracion', 'matriz', 'gestion de riesgo', 'evaluacion de riesgo'] },
    { patterns: ['equipo peligroso', 'trabajo en altura'], weight: 1.5, desc: 'condicion peligrosa' },
  ]},
  { grade: 5, desc: 'Alta peligrosidad', indicators: [
    { patterns: ['alta peligrosidad', 'insalubridad', 'enfermedad profesional', 'ambiente extremo', 'radiacion', 'peligro constante'], weight: 2, desc: 'peligro permanente' },
    { patterns: ['toxicos', 'material peligroso', 'alta exposicion'], weight: 1.5, desc: 'exposicion a toxicos' },
  ]},
];

const ERROR_PROFILES: GradeProfile[] = [
  { grade: 1, desc: 'Error facil de corregir', indicators: [
    { patterns: ['facil de corregir', 'facil de detectar', 'sin impacto', 'bajo impacto', 'minimo efecto', 'error facil'], weight: 2, desc: 'error de bajo impacto' },
  ]},
  { grade: 2, desc: 'Retrasos menores', indicators: [
    { patterns: ['retraso menor', 'demora', 'interno', 'proceso interno', 'reasignacion'], weight: 2, desc: 'impacto interno menor' },
  ]},
  { grade: 3, desc: 'Afecta servicio', indicators: [
    { patterns: ['afecta servicio', 'departamento', 'cliente', 'usuario', 'ciudadano', 'externo', 'interrumpe'], weight: 2, desc: 'impacto en servicio externo' },
  ]},
  { grade: 4, desc: 'Perdidas economicas o legales', indicators: [
    { patterns: ['perdida economica', 'perdida financiera', 'legal', 'multa', 'sancion', 'significativo', 'demanda', 'penal'], weight: 2, desc: 'consecuencia economica/legal' },
  ]},
  { grade: 5, desc: 'Compromete estabilidad institucional', indicators: [
    { patterns: ['estabilidad', 'seguridad publica', 'institucional', 'critico', 'nacional', 'reputacion', 'crisis', 'confianza publica', 'irreversible'], weight: 2, desc: 'impacto institucional critico' },
  ]},
];

const EDUC_LEVELS: { patterns: string[]; score: number; label: string }[] = [
  { patterns: ['primaria', 'basica', 'alfabeto', 'no requiere'], score: 1, label: 'educacion basica' },
  { patterns: ['bachillerato', 'media', 'secundaria', 'tecnico basico', 'educacion diversificada'], score: 2, label: 'bachillerato' },
  { patterns: ['diplomado', 'tecnico superior', 'parauniversitario', 'tecnico medio'], score: 3, label: 'tecnico superior' },
  { patterns: ['licenciatura', 'universitario', 'bachillerato universitario', 'profesional', 'grado universitario'], score: 4, label: 'licenciatura' },
  { patterns: ['maestria', 'master', 'magister', 'especializacion', 'doctorado', 'phd', 'posgrado'], score: 5, label: 'maestria/doctorado' },
];

// ─── Rubric evaluation core ──────────────────────────────────

function patternMatchesInSentence(normalized: string, pattern: string, exclude?: string[]): boolean {
  const sentences = normalized.split(/[.!;\n]+/).map(s => s.trim()).filter(Boolean);
  for (const s of sentences) {
    if (!s.includes(pattern)) continue;
    if (exclude && exclude.some(ex => s.includes(ex))) continue;
    return true;
  }
  return false;
}

function evaluateByRubric(text: string, profiles: GradeProfile[]): RubricScore {
  const normalized = normalizeText(text);
  const coverage: number[] = [0, 0, 0, 0, 0, 0];
  const gradedCoverage: number[] = [0, 0, 0, 0, 0, 0];
  const matched: Record<number, string[]> = {};

  for (const profile of profiles) {
    let matchedWeight = 0;
    let totalWeight = 0;
    const indicators: string[] = [];

    for (const ind of profile.indicators) {
      totalWeight += ind.weight;
      for (const p of ind.patterns) {
        if (patternMatchesInSentence(normalized, p, ind.contextExclude)) {
          matchedWeight += ind.weight;
          indicators.push(ind.desc);
          break;
        }
      }
    }

    const cov = totalWeight > 0 ? matchedWeight / totalWeight : 0;
    coverage[profile.grade] = cov;
    gradedCoverage[profile.grade] = matchedWeight;
    matched[profile.grade] = [...new Set(indicators)].slice(0, 4);
  }

  // Compute noise for each grade
  let bestGrade = 1;
  let bestScore = -1;

  for (let g = 1; g <= 5; g++) {
    const otherCoverages = [1, 2, 3, 4, 5].filter(x => x !== g).map(x => coverage[x]);
    const avgNoise = otherCoverages.reduce((a, b) => a + b, 0) / otherCoverages.length;
    const penalty = coverage[g] < 0.2 ? 0.5 : 1;
    const score = coverage[g] * (1 - 0.4 * avgNoise) * penalty;

    if (score > bestScore) {
      bestScore = score;
      bestGrade = g;
    }
  }

  return { grade: bestGrade, coverage, gradedCoverage, matched };
}

function buildRubricJustification(
  factorLabel: string, result: RubricScore, desc: string,
  source: string, procBoost?: boolean,
): string {
  const c = result.coverage[result.grade];
  const matchedList = result.matched[result.grade] || [];

  let confidence = '';
  if (c >= 0.7) confidence = 'La evidencia es consistente y suficiente para este nivel.';
  else if (c >= 0.4) confidence = 'La evidencia sugiere este nivel, aunque no todos los indicadores estan presentes en la descripcion.';
  else confidence = 'Se asigna este nivel como el mas conservador, dado que no hay evidencia concluyente para un nivel superior.';

  const otherGrades = [1, 2, 3, 4, 5].filter(g => g !== result.grade && result.coverage[g] >= 0.2);
  const noiseText = otherGrades.length > 0
    ? ` Otros niveles tienen cobertura parcial (G${otherGrades.join(', G')}) pero sin suficiente peso para cambiar la asignacion.`
    : '';

  const procText = procBoost ? ' Los procedimientos operativos asociados aportaron evidencia adicional que refuerza esta asignacion.' : '';

  return `Evaluacion de ${factorLabel}: se comparo la descripcion de ${source} contra los 5 perfiles de la rubrica MSC. ` +
    `El perfil con mayor coincidencia fue Grado ${result.grade} (${desc}) con ${matchedList.length} indicador${matchedList.length !== 1 ? 'es' : ''} presente${matchedList.length !== 1 ? 's' : ''}: ${matchedList.join(', ')}. ` +
    `${confidence}${noiseText}${procText} ` +
    `En consecuencia, se asigna Grado ${result.grade} segun la rubrica MSC.`;
}

// ─── Factor evaluators ───────────────────────────────────────

function evaluateByProfile(
  text: string, profiles: GradeProfile[], factorLabel: string,
  source: string,
): { grado: number; justification: string; details: RubricScore } {
  const result = evaluateByRubric(text, profiles);
  const profile = profiles.find(p => p.grade === result.grade);
  const just = buildRubricJustification(factorLabel, result, profile?.desc || '', source, false);
  return { grado: result.grade, justification: just, details: result };
}

function evaluateRequisitos(educacion: string): { grado: number; keyword: string; evidence: string } {
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

function ruleBasedEvaluation(puesto: any, procText?: string): AIEvaluationResult {
  const funciones = puesto.descripcion_funciones || '';
  const educacion = puesto.educacion_requerida || '';
  const procCount = procText ? procText.split('---').filter(s => s.includes(':')).length : 0;

  const configs: { key: keyof EvaluationSuggestion; profiles: GradeProfile[]; label: string; maxPts: number }[] = [
    { key: 'dificultad', profiles: DIFICULTAD_PROFILES, label: 'Dificultad de Funciones', maxPts: 200 },
    { key: 'supervision', profiles: SUPERVISION_PROFILES, label: 'Supervision Ejercida', maxPts: 150 },
    { key: 'responsabilidad', profiles: RESP_PROFILES, label: 'Responsabilidad', maxPts: 200 },
    { key: 'condiciones', profiles: COND_PROFILES, label: 'Condiciones de Trabajo', maxPts: 100 },
    { key: 'error', profiles: ERROR_PROFILES, label: 'Consecuencia del Error', maxPts: 150 },
  ];

  function continuousPoints(cov: number[], maxPts: number): number {
    const total = cov[1] + cov[2] + cov[3] + cov[4] + cov[5];
    if (total === 0) return 0;
    const weighted = (1*cov[1] + 2*cov[2] + 3*cov[3] + 4*cov[4] + 5*cov[5]) / total;
    const clamped = Math.max(1, Math.min(5, weighted));
    return maxPts * (clamped - 1) / 4;
  }

  const result: any = {};
  let continuousTotal = 0;

  for (const { key, profiles, label, maxPts } of configs) {
    const funcEval = evaluateByProfile(funciones, profiles, label, 'las funciones del puesto');
    result[key] = funcEval.grado;
    let just = funcEval.justification;
    let cov = funcEval.details.coverage;

    if (procText) {
      const procEval = evaluateByProfile(procText, profiles, label, 'los procedimientos asociados');
      if (procEval.grado > funcEval.grado) {
        const boost = Math.min(5, funcEval.grado + Math.round((procEval.grado - funcEval.grado) * 0.5));
        result[key] = boost;
        cov = procEval.details.coverage;
        just = buildRubricJustification(label, procEval.details, profiles.find(p => p.grade === procEval.grado)?.desc || '', 'las funciones del puesto y los procedimientos operativos', true);
      }
    }

    continuousTotal += continuousPoints(cov, maxPts);
    result[`${key}_just`] = just;
  }

  const { grado: reqGrado, evidence: reqEvidence } = evaluateRequisitos(educacion);
  result.requisitos = reqGrado;
  continuousTotal += 200 * (Math.max(1, Math.min(5, reqGrado)) - 1) / 4;
  result.requisitos_just = reqEvidence && reqEvidence !== 'educacion basica'
    ? `Evaluacion de Requisitos: el puesto requiere "${reqEvidence}", lo cual corresponde a Grado ${reqGrado} segun la escala de formacion academica MSC.`
    : `Evaluacion de Requisitos: se requiere "${reqEvidence}", asignando Grado ${reqGrado} segun la rubrica MSC.`;

  const evaluated = validateAndCalculate(result, puesto.id, 'rule-based');
  evaluated.totalPuntos = Math.round(continuousTotal);
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
