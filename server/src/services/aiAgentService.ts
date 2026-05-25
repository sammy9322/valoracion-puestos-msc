import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';
import { enrich as enrichProc } from './procedimientosService';
import { contextualEvaluate, POINTS_MAP, CONTINUOUS_MAX, FACTOR_NAMES, EvaluationSuggestion, FactorKeywordDetail, AIEvaluationResult, MultiFuenteEntry } from './contextualAnalyzer';
import type { InterviewContext } from './interviewParser';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'deepseek-coder-v2:latest';
export const BUILD_VERSION = 'v12-contextual';

let ollamaAvailable = true;

async function checkOllama(): Promise<boolean> {
  return true;
}

checkOllama().then(() => {
  console.log('[AI Service] Conectado a Google Gemini API — usando motor LLM en la nube');
});

export { POINTS_MAP, CONTINUOUS_MAX, FactorKeywordDetail } from './contextualAnalyzer';
export type { InterviewContext };

export function getEngineStatus(): { ollamaAvailable: boolean; activeEngine: 'llm' | 'rule-based' } {
  return { ollamaAvailable, activeEngine: ollamaAvailable ? 'llm' : 'rule-based' };
}

function ruleBasedEvaluation(puesto: any, procCtx?: any): AIEvaluationResult {
  const result = contextualEvaluate(puesto, procCtx);
  result.buildVersion = result.buildVersion || BUILD_VERSION;
  return result;
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

function buildPrompt(puesto: any, interviewCtx?: InterviewContext): string {
  const gradeTable = Object.entries({
    dificultad: [
      'Grado 1 (40 pts): Tareas simples y repetitivas, poca iniciativa.',
      'Grado 2 (80 pts): Tareas variadas pero estandarizadas.',
      'Grado 3 (120 pts): Requiere analisis y juicio para resolver problemas tecnicos.',
      'Grado 4 (160 pts): Alta complejidad, planeacion y coordinacion institucional.',
      'Grado 5 (200 pts): Direccion estrategica y toma de decisiones criticas.'
    ],
    supervision: [
      'Grado 1 (30 pts): No ejerce supervision.',
      'Grado 2 (60 pts): Supervision ocasional de tareas simples.',
      'Grado 3 (90 pts): Supervision de un grupo de trabajo operativo.',
      'Grado 4 (120 pts): Jefatura de una unidad o departamento.',
      'Grado 5 (150 pts): Direccion de un area tecnica o administrativa mayor.'
    ],
    responsabilidad: [
      'Grado 1 (40 pts): Baja responsabilidad por valores o equipo.',
      'Grado 2 (80 pts): Responsabilidad moderada por materiales y herramientas.',
      'Grado 3 (120 pts): Custodia de informacion sensible o fondos fijos.',
      'Grado 4 (160 pts): Responsabilidad por presupuestos o activos de alto valor.',
      'Grado 5 (200 pts): Responsabilidad total por la gestion de un proceso clave.'
    ],
    condiciones: [
      'Grado 1 (20 pts): Ambiente de oficina normal, riesgos minimos.',
      'Grado 2 (40 pts): Esfuerzo fisico moderado o ambiente algo incomodo.',
      'Grado 3 (60 pts): Exposicion a condiciones climaticas o ruido constante.',
      'Grado 4 (80 pts): Riesgo de accidentes laborales o manejo de quimicos.',
      'Grado 5 (100 pts): Condiciones de alta peligrosidad o insalubridad constante.'
    ],
    error: [
      'Grado 1 (30 pts): Error facil de detectar y corregir.',
      'Grado 2 (60 pts): Error causa retrasos menores en el flujo de trabajo.',
      'Grado 3 (90 pts): Error afecta a otros departamentos o al servicio al cliente.',
      'Grado 4 (120 pts): Error causa perdidas economicas o legales significativas.',
      'Grado 5 (150 pts): Error compromete la estabilidad institucional o seguridad publica.'
    ],
    requisitos: [
      'Grado 1 (40 pts): Educacion basica o primaria.',
      'Grado 2 (80 pts): Bachillerato en Educacion Media o Tecnico basico.',
      'Grado 3 (120 pts): Diplomado o Tecnico superior especializado.',
      'Grado 4 (160 pts): Bachillerato Universitario o Licenciatura profesional.',
      'Grado 5 (200 pts): Grado de Maestria o especializacion avanzada requerida.'
    ]
  }).map(([factor, grades]) => `${FACTOR_NAMES[factor] || factor}:\n${grades.map(g => `  ${g}`).join('\n')}`).join('\n\n');

  let interviewSection = '';
  if (interviewCtx && interviewCtx.factores) {
    interviewSection = `\n=== EVIDENCIA DE ENTREVISTA AL OCUPANTE ===\nA continuacion se presentan datos extraidos de una entrevista al ocupante actual del puesto. Evalua si esta evidencia testimonial complementa, contradice o refuerza la descripcion documental.\n\n`;
    
    for (const f of interviewCtx.factores) {
      interviewSection += `Factor: ${f.factor}\n`;
      interviewSection += `Resumen: ${f.resumen_entrevista}\n`;
      for (const c of f.citas) {
        interviewSection += `- Cita: "${c.cita_textual}" (${c.contexto}, relevancia: ${c.relevancia})\n`;
      }
      interviewSection += '\n';
    }
    
    if (interviewCtx.alertas && interviewCtx.alertas.length > 0) {
      interviewSection += `Alertas de la entrevista:\n${interviewCtx.alertas.map(a => `- ${a}`).join('\n')}\n\n`;
    }
  }

  return `
Eres el EVALUADOR TECNICO OFICIAL del sistema de valoracion de puestos de la Municipalidad de San Carlos.
Tu analisis es objetivo, vinculante y constituye un documento oficial con implicaciones administrativas y legales.
Debes basarte en una SINTESIS MULTIFUENTE DE 3 PILARES: la Ficha Oficial del puesto (funciones y requisitos), la EVIDENCIA DE ENTREVISTA AL OCUPANTE (si fue proporcionada) y los PROCEDIMIENTOS ASOCIADOS DEL DEPARTAMENTO (inyectados al final de la descripcion de funciones). Debes aplicar la metodologia MSC (Manual de Clases) de Puntos por Factores con rigor tecnico y profesional.

=== DATOS DEL PUESTO A EVALUAR ===
Nombre del puesto: ${sanitizeInput(puesto.nombre) || 'No especificado'}
Area/Departamento: ${sanitizeInput(puesto.area) || 'General'}
Reporta a: ${sanitizeInput(puesto.reporta_a) || 'No especificado'}

=== DESCRIPCION DE FUNCIONES ===
${sanitizeInput(puesto.descripcion_funciones) || 'No especificadas'}

=== REQUISITOS DEL PUESTO ===
Educacion requerida: ${sanitizeInput(puesto.educacion_requerida) || 'No especificada'}
Experiencia requerida: ${sanitizeInput(puesto.experiencia_requerida) || 'No especificada'}
${interviewSection}
=== ESCALA DE GRADOS POR FACTOR ===
Cada factor se califica del 1 (minimo) al 5 (maximo).

${gradeTable}

=== METODOLOGIA DE ANALISIS TECNICO (SINTESIS DE 3 PILARES) ===
Para CADA factor, realiza un analisis multidimensional cruzando nuestras 3 fuentes de verdad:

1. **Naturaleza del trabajo (Ficha + Procedimientos)**: Evalua la complejidad de las funciones de la Ficha combinandola con los Procedimientos del departamento (inyectados al final de las funciones). Observa especialmente los pasos que tienen el marcador "(¡EL PUESTO EVALUADO REALIZA ESTA TAREA!)", ya que demuestran la carga real, nivel de juicio y complejidad operativa que ejecuta el puesto.

2. **Contexto de la realidad operativa (Entrevista)**: Compara la descripcion en el papel con lo expresado en la Entrevista del ocupante. Si la entrevista o las tareas operativas de los procedimientos demuestran mayor responsabilidad, autonomia, alcance o exposicion a riesgos que la descripcion de la ficha, debes valorar el puesto en base a su REALIDAD OPERATIVA (Entrevista + Procedimientos) y no solo al documento base.

3. **Evidencia textual especifica**: Identifica y CITA textualmente las partes de la Ficha, de la ENTREVISTA o de los PASOS DEL PROCEDIMIENTO que demuestren el nivel del factor. La justificacion DEBE hacer referencia directa a fragmentos textuales, envolviendolos SIEMPRE en comillas dobles ("..."). Si no usas comillas dobles, el reporte sera rechazado.

4. **Asignacion de Grado y Puntos**: Selecciona el grado que MEJOR refleje la totalidad de la evidencia cruzada. Si la entrevista y la participacion en procedimientos elevan la responsabilidad real del puesto por encima de lo documentado, prioriza la realidad operativa. Cada grado debe estar plenamente justificado.

=== INSTRUCCIONES CRITICAS ===
- Este informe tiene CARACTER VINCULANTE y puede ser usado en procesos administrativos, recursos de revision y reclamaciones legales. Actua con la maxima responsabilidad tecnica.
- Cada grado debe ser un numero entero entre 1 y 5.
- Cada justificacion debe tener entre 2 y 4 oraciones. Es OBLIGATORIO incluir al menos una cita textual exacta usando comillas dobles ("cita") de cualquiera de las 3 fuentes de verdad.
- OBLIGATORIO MULTIFUENTE: Si existe EVIDENCIA DE ENTREVISTA para el factor, ESTAS OBLIGADO a cambiar el campo "_fuente" a "mixta" o "entrevista". ¡NUNCA uses "documental" si la entrevista aporto contexto!
- OBLIGATORIO CITAS MIXTAS: Si usas "mixta", ESTAS OBLIGADO a llenar el campo "_cita_entrevista" con la cita textual de la entrevista y explicar en tu justificacion si la entrevista refuerza o contradice el documento.
- Si no hay evidencia clara, asigna el grado mas conservador (1).
- Devuelve UNICAMENTE el objeto JSON, sin texto adicional ni codigo.

=== EJEMPLO DE JUSTIFICACION TECNICA ADECUADA ===
"dificultad_just": "Las funciones describen que el puesto 'analiza y evalua informacion tecnica para la toma de decisiones departamentales', lo cual evidencia un nivel de analisis y juicio profesional (Grado 3). Adicionalmente, se menciona 'coordina la ejecucion de programas operativos', lo que requiere planificacion de alcance medio. No se identifican funciones de diseno estrategico o direccion institucional que justifiquen un nivel superior."

=== FORMATO JSON REQUERIDO ===
{
  "dificultad": <1-5>,
  "dificultad_just": "<justificacion tecnica>",
  "dificultad_cita_documental": "<cita textual de las funciones>",
  "dificultad_fuente": "documental|entrevista|mixta",
  "dificultad_cita_entrevista": "<cita textual de la entrevista si aplica o ''>",

  "supervision": <1-5>,
  "supervision_just": "<justificacion tecnica>",
  "supervision_cita_documental": "<cita textual>",
  "supervision_fuente": "documental|entrevista|mixta",
  "supervision_cita_entrevista": "<cita o ''>",

  "responsabilidad": <1-5>,
  "responsabilidad_just": "<justificacion tecnica>",
  "responsabilidad_cita_documental": "<cita textual>",
  "responsabilidad_fuente": "documental|entrevista|mixta",
  "responsabilidad_cita_entrevista": "<cita o ''>",

  "condiciones": <1-5>,
  "condiciones_just": "<justificacion tecnica>",
  "condiciones_cita_documental": "<cita textual>",
  "condiciones_fuente": "documental|entrevista|mixta",
  "condiciones_cita_entrevista": "<cita o ''>",

  "error": <1-5>,
  "error_just": "<justificacion tecnica>",
  "error_cita_documental": "<cita textual>",
  "error_fuente": "documental|entrevista|mixta",
  "error_cita_entrevista": "<cita o ''>",

  "requisitos": <1-5>,
  "requisitos_just": "<justificacion tecnica>",
  "requisitos_cita_documental": "<cita textual>",
  "requisitos_fuente": "documental|entrevista|mixta",
  "requisitos_cita_entrevista": "<cita o ''>",

  "alertas_contradiccion": ["<alerta si hay contradiccion entre fuentes>"]
}
`;
}

function validateAndCalculate(suggestion: any, puesto_id: string, motor: 'llm' | 'rule-based' = 'llm'): AIEvaluationResult {
  const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];
  const errors: string[] = [];
  const analisis_multifuente: MultiFuenteEntry[] = [];

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

    // Extraer campos multifuente
    const citaDocKey = `${factor}_cita_documental`;
    const citaEntKey = `${factor}_cita_entrevista`;
    const fuenteKey = `${factor}_fuente`;
    const citaDocumental = suggestion[citaDocKey] || '';
    const citaEntrevista = suggestion[citaEntKey] || '';
    const fuentePrincipal: 'documental' | 'entrevista' | 'mixta' =
      (['documental', 'entrevista', 'mixta'].includes(suggestion[fuenteKey]))
        ? suggestion[fuenteKey]
        : (citaEntrevista ? 'mixta' : 'documental');

    // Detectar contradiccion: si hay cita de entrevista que contradice lo documental
    const contradiccion = !!(citaEntrevista && citaDocumental && (
      suggestion[`${factor}_contradiccion`] === true ||
      suggestion[`${factor}_contradiccion`] === 'true'
    ));

    analisis_multifuente.push({
      factor,
      grado: Number(suggestion[factor]),
      puntos: POINTS_MAP[factor][Number(suggestion[factor])] || 0,
      justificacion_documental: suggestion[justKey] || '',
      cita_documental: citaDocumental,
      justificacion_entrevista: undefined,
      cita_entrevista: citaEntrevista || undefined,
      fuente_principal: fuentePrincipal,
      contradiccion,
      detalle_contradiccion: contradiccion
        ? `La evidencia documental y la entrevista difieren en el factor ${factor}.`
        : undefined
    });
  }

  let totalPuntos = 0;
  for (const factor of FACTORS) {
    totalPuntos += POINTS_MAP[factor][suggestion[factor]];
  }

  const alertasContradiccion: string[] = suggestion.alertas_contradiccion || [];
  const alertaGlobal = alertasContradiccion.length > 0
    ? `Se detectaron ${alertasContradiccion.length} alertas de contradiccion entre fuentes.`
    : undefined;

  return {
    success: errors.length === 0,
    data: suggestion as EvaluationSuggestion,
    totalPuntos,
    puesto_id,
    analisis_completo: errors.length === 0,
    motor,
    analisis_multifuente,
    alerta_global: alertaGlobal
  };
}

async function callOllama(prompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } });
  const result = await model.generateContent(prompt);
  const jsonText = result.response.text();
  const match = jsonText.match(/\{[\s\S]*\}/);
  const cleanJson = match ? match[0] : jsonText;
  return JSON.parse(cleanJson);
}

function calculateFactorPoints(data: EvaluationSuggestion): Record<string, number> {
  return {
    dificultad: POINTS_MAP.dificultad[data.dificultad],
    supervision: POINTS_MAP.supervision[data.supervision],
    responsabilidad: POINTS_MAP.responsabilidad[data.responsabilidad],
    condiciones: POINTS_MAP.condiciones[data.condiciones],
    error: POINTS_MAP.error[data.error],
    requisitos: POINTS_MAP.requisitos[data.requisitos],
  };
}

export const aiAgentService = {
    getEngineStatus,

    async evaluate(puesto: any, interviewCtx?: InterviewContext): Promise<AIEvaluationResult> {
        const procCtx = await enrichProc(puesto).catch(() => null);
        const procText = procCtx ? procCtx.textoCompleto : undefined;
        let result: AIEvaluationResult;
        if (ollamaAvailable) {
          try {
            let funcionesConProcedimientos = puesto.descripcion_funciones;
            if (procText) {
              funcionesConProcedimientos = `${puesto.descripcion_funciones}\n\n--- PROCEDIMIENTOS ASOCIADOS ---\n${procText}`;
            }
            const enrichedPuesto = { ...puesto, descripcion_funciones: funcionesConProcedimientos };
            const prompt = buildPrompt(enrichedPuesto, interviewCtx);
            const raw = await callOllama(prompt);
            result = validateAndCalculate(raw, puesto.id, 'llm');
            result.factorPoints = calculateFactorPoints(result.data);
            if (procCtx) result.procedimientosCount = procCtx.totalProcedimientos;
            result.buildVersion = BUILD_VERSION;
            result.interviewContext = interviewCtx;
          } catch (error: any) {
            console.warn('[AI Service] Error en LLM, cayendo a rule-based:', error.message);
            result = ruleBasedEvaluation(puesto, procCtx); result.alerta_global = "Error cru00EDtico en IA evaluadora (Gemini fallu00F3, revisa tu API KEY en Vercel). Se utilizu00F3 el motor bu00E1sico basado en reglas, el cual IGNORA la entrevista.";
          }
        } else {
          result = ruleBasedEvaluation(puesto, procCtx); result.alerta_global = "Error cru00EDtico en IA evaluadora (Ollama fallu00F3 o agotu00F3 memoria). Se utilizu00F3 el motor bu00E1sico basado en reglas, el cual IGNORA la entrevista.";
        }
        return result;
    },

    async suggestEvaluation(puesto: any): Promise<EvaluationSuggestion | null> {
        const procCtx = await enrichProc(puesto).catch(() => null);
        const procText = procCtx ? procCtx.textoCompleto : undefined;
        if (!ollamaAvailable) {
          const result = ruleBasedEvaluation(puesto, procCtx); result.alerta_global = "Error cru00EDtico en IA evaluadora (Ollama fallu00F3 o agotu00F3 memoria). Se utilizu00F3 el motor bu00E1sico basado en reglas, el cual IGNORA la entrevista.";
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
            const result = ruleBasedEvaluation(puesto, procCtx); result.alerta_global = "Error cru00EDtico en IA evaluadora (Ollama fallu00F3 o agotu00F3 memoria). Se utilizu00F3 el motor bu00E1sico basado en reglas, el cual IGNORA la entrevista.";
            return result.data;
        }
    }
};
