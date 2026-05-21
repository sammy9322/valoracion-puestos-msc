import { FACTOR_CONFIG, POINTS_MAP } from '../config/factorTables';
import { ValuationReportSchema, type ValuationReport } from './outputValidator';
import { validateObjectivity } from './guardrails';
import { aiAgentService } from './aiAgentService';

export async function runValuationPipeline(puesto: any): Promise<ValuationReport & { warnings: string[] }> {
  // 1. Documentation Collection (Contextual Enrichment)
  const evaluationResult = await aiAgentService.evaluate(puesto);
  
  // 2. LLM Call & Response (Using existing aiAgentService as engine)
  const rawData = evaluationResult.data;
  
  // 3. Zod Validation
  const validation = ValuationReportSchema.safeParse({
    puesto_id: puesto.id,
    totalPuntos: evaluationResult.totalPuntos,
    evaluacion: rawData,
    auditoria: {
      motor: evaluationResult.motor || 'llm',
      buildVersion: evaluationResult.buildVersion || 'v12-auditory',
      timestamp: new Date().toISOString(),
      confidence: 0.95,
      evidenceFound: []
    }
  });

  if (!validation.success) {
    throw new Error(`AI Response validation failed: ${validation.error.message}`);
  }

  const report = validation.data;

  // 4. Guardrails Filter (Objectivity Check)
  const { isValid, warnings } = validateObjectivity(report);

  return {
    ...report,
    warnings
  };
}
