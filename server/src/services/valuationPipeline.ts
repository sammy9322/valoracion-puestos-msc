import { FACTOR_CONFIG, POINTS_MAP } from '../config/factorTables';
import { ValuationReportSchema, type ValuationReport } from './outputValidator';
import { validateObjectivity } from './guardrails';
import { aiAgentService } from './aiAgentService';
import { calculateConfidence } from './confidenceCalculator';

export async function runValuationPipeline(puesto: any, interviewCtx?: any): Promise<ValuationReport & { warnings: string[]; analisis_multifuente?: any; alerta_global?: string }> {
  // 1. Documentation Collection (Contextual Enrichment)
  const evaluationResult = await aiAgentService.evaluate(puesto, interviewCtx);
  
  // 2. LLM Call & Response (Using existing aiAgentService as engine)
  const rawData = evaluationResult.data;
  
  // 3. Calculation of Dynamic Confidence
  const hasProcedimientos = evaluationResult.procedimientosCount ? evaluationResult.procedimientosCount > 0 : false;
  const confidenceResult = calculateConfidence(rawData, evaluationResult.motor || 'llm', hasProcedimientos);

  if (!confidenceResult.isValid) {
    throw new Error(`Análisis incompleto: requiere revisión humana. Confianza calculada (${confidenceResult.confidence}) por debajo del umbral mínimo (0.60).`);
  }

  // 4. Zod Validation
  const validation = ValuationReportSchema.safeParse({
    puesto_id: puesto.id,
    totalPuntos: evaluationResult.totalPuntos,
    evaluacion: rawData,
    auditoria: {
      motor: evaluationResult.motor || 'llm',
      buildVersion: evaluationResult.buildVersion || 'v12-auditory',
      timestamp: new Date().toISOString(),
      confidence: confidenceResult.confidence,
      evidenceFound: confidenceResult.evidenceFound,
      confidenceBreakdown: confidenceResult.breakdown
    }
  });

  if (!validation.success) {
    throw new Error(`AI Response validation failed: ${validation.error.message}`);
  }

  const report = validation.data;

  // 5. Guardrails Filter (Objectivity Check)
  const { warnings } = validateObjectivity(report);

  // Merge penalties into warnings for visibility
  confidenceResult.breakdown.penalties.forEach(p => {
    warnings.push(`Penalización de confianza (${p.deduction}): ${p.reason}`);
  });

  return {
    ...report,
    warnings,
    analisis_multifuente: evaluationResult.analisis_multifuente,
    alerta_global: evaluationResult.alerta_global
  };
}
