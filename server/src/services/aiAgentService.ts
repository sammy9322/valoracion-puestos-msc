import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { enrich as enrichProc } from './procedimientosService';
import { contextualEvaluate, FACTOR_NAMES, EvaluationSuggestion, FactorKeywordDetail, AIEvaluationResult, MultiFuenteEntry } from './contextualAnalyzer';
import { FACTOR_CONFIG, getFactorPoints, POINTS_MAP, type Intensidad } from '../config/factorTables';
import type { InterviewContext } from './interviewParser';

export const BUILD_VERSION = 'v13-ensemble-temp0';

export { POINTS_MAP } from '../config/factorTables';
export { FactorKeywordDetail } from './contextualAnalyzer';
export type { InterviewContext };

export function getEngineStatus(): { activeEngine: 'llm' | 'rule-based' } {
  return { activeEngine: 'llm' };
}

function ruleBasedEvaluation(puesto: any, procCtx?: any, interviewCtx?: any): AIEvaluationResult {
  const result = contextualEvaluate(puesto, procCtx, interviewCtx);
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

function buildPrompt(puesto: any, interviewCtx?: InterviewContext, baseline?: any): string {
  const gradeTable = Object.entries(FACTOR_CONFIG).map(([factor, cfg]) => {
    const label = FACTOR_NAMES[factor] || cfg.label;
    const lines = cfg.grades.map((g, i) => {
      if (i === 0) return '';
      const [min, max] = cfg.ranges[i];
      return `  Grado ${i} (${min}-${max} pts): ${g}`;
    }).filter(Boolean);
    return `${label} (${cfg.maxPts} pts max):\n${lines.join('\n')}`;
  }).join('\n\n');

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

  let baselineSection = '';
  if (baseline) {
    baselineSection = `
=== LÍNEA BASE DETERMINISTA ===
El sistema experto basado en reglas ya ha evaluado la Ficha Oficial y asignó los siguientes grados base:
- Dificultad: Grado ${baseline.dificultad}
- Supervisión: Grado ${baseline.supervision}
- Responsabilidad: Grado ${baseline.responsabilidad}
- Condiciones: Grado ${baseline.condiciones}
- Error: Grado ${baseline.error}
- Requisitos: Grado ${baseline.requisitos}

=== TU ÚNICA MISIÓN ===
1. Eres un auditor de entrevistas.
2. Compara la EVIDENCIA DE LA ENTREVISTA con la LÍNEA BASE.
3. Si la entrevista NO aporta nada nuevo o no existe, DEBES devolver exactamente los mismos grados de la línea base.
4. SOLO puedes elevar o modificar un grado si la entrevista demuestra responsabilidades operativas irrefutablemente mayores al documento base.
`;
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

=== CONTEXTO DE SERIE Y ACOTACIÓN JERÁRQUICA ===
Este puesto pertenece a la serie laboral: ${puesto.estrato || 'No determinada'}
La serie define el tope máximo de puntos que puede alcanzar el puesto.
No asignes una clase o puntuación total que exceda el límite de su serie.
${puesto.estrato ? (() => {
  const limites: Record<string, string> = {
    'Operativa': 'MÁXIMO 355 PUNTOS — Clase tope: Operativo Municipal 6',
    'Administrativa': 'MÁXIMO 355 PUNTOS — Clase tope: Administrativo Municipal 4',
    'Policia': 'MÁXIMO 345 PUNTOS — Clase tope: Policia Municipal 5',
    'Tecnica': 'MÁXIMO 390 PUNTOS — Clase tope: Tecnico Municipal 3',
    'Profesional': 'MÁXIMO 610 PUNTOS — Clase tope: Profesional Municipal 4',
    'Jefatura': 'MÁXIMO 880 PUNTOS — Clase tope: Profesional Jefe 5'
  };
  for (const [serie, texto] of Object.entries(limites)) {
    if (puesto.estrato.toLowerCase().includes(serie.toLowerCase())) return texto;
  }
  return '';
})() : 'Límite por defecto: 1000 PUNTOS'}

=== REQUISITOS DEL PUESTO ===
Educacion requerida: ${sanitizeInput(puesto.educacion_requerida) || 'No especificada'}
Experiencia requerida: ${sanitizeInput(puesto.experiencia_requerida) || 'No especificada'}
${interviewSection}
${baselineSection}
=== ESCALA DE GRADOS POR FACTOR ===
Cada factor se califica del 1 (minimo) al 6 (maximo) segun la rubrica oficial, excepto Condiciones de Trabajo que va del 1 al 5.
Ademas, para cada factor debes evaluar la INTENSIDAD (bajo, medio o alto) basandote en que tan profundo calzan las funciones dentro del grado asignado.

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
  "dificultad": <1-6>,
  "dificultad_just": "<justificacion tecnica>",
  "dificultad_cita_documental": "<cita textual de las funciones>",
  "dificultad_fuente": "documental|entrevista|mixta",
  "dificultad_cita_entrevista": "<cita textual de la entrevista si aplica o ''>",
  "dificultad_intensidad": "bajo|medio|alto",

  "supervision": <1-6>,
  "supervision_just": "<justificacion tecnica>",
  "supervision_cita_documental": "<cita textual>",
  "supervision_fuente": "documental|entrevista|mixta",
  "supervision_cita_entrevista": "<cita o ''>",
  "supervision_intensidad": "bajo|medio|alto",

  "responsabilidad": <1-6>,
  "responsabilidad_just": "<justificacion tecnica>",
  "responsabilidad_cita_documental": "<cita textual>",
  "responsabilidad_fuente": "documental|entrevista|mixta",
  "responsabilidad_cita_entrevista": "<cita o ''>",
  "responsabilidad_intensidad": "bajo|medio|alto",

  "condiciones": <1-5>,
  "condiciones_just": "<justificacion tecnica>",
  "condiciones_cita_documental": "<cita textual>",
  "condiciones_fuente": "documental|entrevista|mixta",
  "condiciones_cita_entrevista": "<cita o ''>",
  "condiciones_intensidad": "bajo|medio|alto",

  "error": <1-6>,
  "error_just": "<justificacion tecnica>",
  "error_cita_documental": "<cita textual>",
  "error_fuente": "documental|entrevista|mixta",
  "error_cita_entrevista": "<cita o ''>",
  "error_intensidad": "bajo|medio|alto",

  "requisitos": <1-6>,
  "requisitos_just": "<justificacion tecnica>",
  "requisitos_cita_documental": "<cita textual>",
  "requisitos_fuente": "documental|entrevista|mixta",
  "requisitos_cita_entrevista": "<cita o ''>",
  "requisitos_intensidad": "bajo|medio|alto",

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
    const maxGrado = factor === 'condiciones' ? 5 : 6;
    if (!Number.isInteger(grado) || grado < 1 || grado > maxGrado) {
      errors.push(`${factor}: debe ser entero entre 1 y ${maxGrado}, recibio ${suggestion[factor]}`);
      suggestion[factor] = 1;
    }
    const justKey = `${factor}_just`;
    if (!suggestion[justKey] || typeof suggestion[justKey] !== 'string' || suggestion[justKey].trim().length < 5) {
      errors.push(`${justKey}: justificacion muy corta o vacia`);
      suggestion[justKey] = suggestion[justKey] || 'Analisis basado en la descripcion de funciones del puesto.';
    }

    // Extraer intensidad (default 'medio')
    const intensidadKey = `${factor}_intensidad`;
    const intensidad: Intensidad = ['bajo', 'medio', 'alto'].includes(suggestion[intensidadKey])
      ? suggestion[intensidadKey]
      : 'medio';
    suggestion[intensidadKey] = intensidad;

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

    const puntos = getFactorPoints(factor, Number(suggestion[factor]), intensidad);

    analisis_multifuente.push({
      factor,
      grado: Number(suggestion[factor]),
      puntos,
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
    const intensidad: Intensidad = ['bajo', 'medio', 'alto'].includes(suggestion[`${factor}_intensidad`])
      ? suggestion[`${factor}_intensidad`]
      : 'medio';
    totalPuntos += getFactorPoints(factor, suggestion[factor], intensidad);
  }

  const alertasContradiccion: string[] = suggestion.alertas_contradiccion || [];
  const alertaGlobal = alertasContradiccion.length > 0
    ? alertasContradiccion.map(alerta => `• ${alerta}`).join('\n')
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

async function callGemini(prompt: string, temperature: number = 0): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');
  const genAI = new GoogleGenerativeAI(apiKey);
  const schema = {
    type: SchemaType.OBJECT as const,
    properties: {
      dificultad: { type: SchemaType.INTEGER as const },
      dificultad_just: { type: SchemaType.STRING as const },
      dificultad_cita_documental: { type: SchemaType.STRING as const },
      dificultad_fuente: { type: SchemaType.STRING as const },
      dificultad_cita_entrevista: { type: SchemaType.STRING as const },
      dificultad_intensidad: { type: SchemaType.STRING as const },
      supervision: { type: SchemaType.INTEGER as const },
      supervision_just: { type: SchemaType.STRING as const },
      supervision_cita_documental: { type: SchemaType.STRING as const },
      supervision_fuente: { type: SchemaType.STRING as const },
      supervision_cita_entrevista: { type: SchemaType.STRING as const },
      supervision_intensidad: { type: SchemaType.STRING as const },
      responsabilidad: { type: SchemaType.INTEGER as const },
      responsabilidad_just: { type: SchemaType.STRING as const },
      responsabilidad_cita_documental: { type: SchemaType.STRING as const },
      responsabilidad_fuente: { type: SchemaType.STRING as const },
      responsabilidad_cita_entrevista: { type: SchemaType.STRING as const },
      responsabilidad_intensidad: { type: SchemaType.STRING as const },
      condiciones: { type: SchemaType.INTEGER as const },
      condiciones_just: { type: SchemaType.STRING as const },
      condiciones_cita_documental: { type: SchemaType.STRING as const },
      condiciones_fuente: { type: SchemaType.STRING as const },
      condiciones_cita_entrevista: { type: SchemaType.STRING as const },
      condiciones_intensidad: { type: SchemaType.STRING as const },
      error: { type: SchemaType.INTEGER as const },
      error_just: { type: SchemaType.STRING as const },
      error_cita_documental: { type: SchemaType.STRING as const },
      error_fuente: { type: SchemaType.STRING as const },
      error_cita_entrevista: { type: SchemaType.STRING as const },
      error_intensidad: { type: SchemaType.STRING as const },
      requisitos: { type: SchemaType.INTEGER as const },
      requisitos_just: { type: SchemaType.STRING as const },
      requisitos_cita_documental: { type: SchemaType.STRING as const },
      requisitos_fuente: { type: SchemaType.STRING as const },
      requisitos_cita_entrevista: { type: SchemaType.STRING as const },
      requisitos_intensidad: { type: SchemaType.STRING as const },
      alertas_contradiccion: { type: SchemaType.ARRAY as const, items: { type: SchemaType.STRING as const } }
    },
    required: ["dificultad", "supervision", "responsabilidad", "condiciones", "error", "requisitos", "dificultad_intensidad", "supervision_intensidad", "responsabilidad_intensidad", "condiciones_intensidad", "error_intensidad", "requisitos_intensidad"]
  };
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json', temperature }
  });
  const result = await model.generateContent(prompt);
  const jsonText = result.response.text();
  const match = jsonText.match(/\{[\s\S]*\}/);
  const cleanJson = match ? match[0] : jsonText;
  return JSON.parse(cleanJson);
}

async function callGeminiEnsemble(prompt: string): Promise<any> {
  const ENSEMBLE_CALLS = 1;
  const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];
  const results: any[] = [];

  for (let i = 0; i < ENSEMBLE_CALLS; i++) {
    try {
      if (i > 0) await new Promise(r => setTimeout(r, 500));
      const raw = await callGemini(prompt);
      for (const f of FACTORS) {
        const maxG = f === 'condiciones' ? 5 : 6;
        if (!raw[f] || raw[f] < 1 || raw[f] > maxG) raw[f] = 1;
      }
      results.push(raw);
    } catch (e) {
      console.error("[AI Service] Error in callGemini:", e);
      continue;
    }
  }

  if (results.length === 0) {
    throw new Error('All ensemble calls to Gemini failed');
  }

  if (results.length === 1) {
    console.warn('[AI Service] Solo 1/3 ensemble calls tuvieron éxito');
    return results[0];
  }

  const modeResult: Record<string, number> = {};
  for (const f of FACTORS) {
    const grados = results.map(r => r[f]);
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    let mode = grados[0];
    for (const g of grados) {
      freq[g] = (freq[g] || 0) + 1;
      if (freq[g] > maxFreq) { maxFreq = freq[g]; mode = g; }
    }
    modeResult[f] = mode;
  }

  return modeResult;
}

function calculateFactorPoints(data: any): Record<string, number> {
  return {
    dificultad: getFactorPoints('dificultad', data.dificultad, data.dificultad_intensidad || 'medio'),
    supervision: getFactorPoints('supervision', data.supervision, data.supervision_intensidad || 'medio'),
    responsabilidad: getFactorPoints('responsabilidad', data.responsabilidad, data.responsabilidad_intensidad || 'medio'),
    condiciones: getFactorPoints('condiciones', data.condiciones, data.condiciones_intensidad || 'medio'),
    error: getFactorPoints('error', data.error, data.error_intensidad || 'medio'),
    requisitos: getFactorPoints('requisitos', data.requisitos, data.requisitos_intensidad || 'medio'),
  };
}

export const aiAgentService = {
    getEngineStatus,

    async evaluate(puesto: any, interviewCtx?: InterviewContext): Promise<AIEvaluationResult> {
        const procCtx = await enrichProc(puesto).catch(() => null);
        const procText = procCtx ? procCtx.textoCompleto : undefined;
        const baselineResult = ruleBasedEvaluation(puesto, procCtx, interviewCtx);
        let result: AIEvaluationResult;
        try {
          let funcionesConProcedimientos = puesto.descripcion_funciones;
          if (procText) {
            funcionesConProcedimientos = `${puesto.descripcion_funciones}\n\n--- PROCEDIMIENTOS ASOCIADOS ---\n${procText}`;
          }
          const enrichedPuesto = { ...puesto, descripcion_funciones: funcionesConProcedimientos };
          const prompt = buildPrompt(enrichedPuesto, interviewCtx, baselineResult.data);
          const raw = await callGeminiEnsemble(prompt);
          result = validateAndCalculate(raw, puesto.id, 'llm');
          result.factorPoints = calculateFactorPoints(result.data);
          if (procCtx) result.procedimientosCount = procCtx.totalProcedimientos;
          result.buildVersion = BUILD_VERSION;
          result.interviewContext = interviewCtx;
        } catch (error: any) {
          console.warn('[AI Service] Error en LLM, cayendo a rule-based:', error.message);
          result = baselineResult;
          result.alerta_global = "Servicio de IA no disponible temporalmente. Se aplicó evaluación basada en reglas." +
            (interviewCtx ? " NOTA: Hay una entrevista adjunta. Por favor asigne puntos extra manualmente si la entrevista demuestra mayor complejidad operativa." : "");
        }
        return result;
    },

    async suggestEvaluation(puesto: any): Promise<EvaluationSuggestion | null> {
        const procCtx = await enrichProc(puesto).catch(() => null);
        const procText = procCtx ? procCtx.textoCompleto : undefined;
        const baselineResult = ruleBasedEvaluation(puesto, procCtx, null);

        try {
            const enrichedPuesto = procText
              ? { ...puesto, descripcion_funciones: `${puesto.descripcion_funciones}\n\n--- PROCEDIMIENTOS ASOCIADOS ---\n${procText}` }
              : puesto;
            const prompt = buildPrompt(enrichedPuesto, undefined, baselineResult.data);
            const raw = await callGeminiEnsemble(prompt);
            return raw as EvaluationSuggestion;
        } catch (error: any) {
            console.warn('[AI Service] Error en suggestEvaluation, usando rule-based:', error.message);
            return baselineResult.data;
        }
    }
};
