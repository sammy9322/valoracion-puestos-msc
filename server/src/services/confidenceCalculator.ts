import { ValuationReport } from './outputValidator';
import { HEURISTIC_RULES } from '../config/heuristicRules';

export interface Penalty {
  reason: string;
  factor?: string;
  deduction: number;
}

export interface ConfidenceBreakdown {
  base: number;
  penalties: Penalty[];
  final: number;
  reasoning?: string;
}

export interface ConfidenceResult {
  confidence: number;
  breakdown: ConfidenceBreakdown;
  isValid: boolean; // false if < 0.60
  evidenceFound: string[];
}

export function calculateConfidence(
  report: any,
  motor: 'llm' | 'rule-based',
  hasProcedimientos: boolean
): ConfidenceResult {
  const penalties: Penalty[] = [];
  const baseConfidence = motor === 'llm' ? 1.0 : 0.90;
  
  if (motor === 'rule-based') {
    penalties.push({
      reason: 'motor_basado_en_reglas',
      deduction: 0.10 // Reflected in base, but useful for audit tracking if we want, but base is 0.90 already. Let's just set base to 0.90 and add a reasoning.
    });
  }

  let currentConfidence = baseConfidence;
  const evidenceFound: string[] = [];

  // 1. Falta de procedimientos de respaldo
  if (!hasProcedimientos) {
    penalties.push({
      reason: 'sin_procedimientos_de_respaldo',
      deduction: -0.08
    });
    currentConfidence -= 0.08;
  }

  // Check each factor's justification
  const factors = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];
  let uncertaintyIncidences = 0;

  factors.forEach(f => {
    const just = report.evaluacion?.[`${f}_just`];
    if (!just) return;

    // 2. Lenguaje de incertidumbre (-0.03 por incidencia, max -0.12 total across all factors)
    HEURISTIC_RULES.uncertaintyKeywords.forEach(word => {
      // Regex para buscar palabra exacta sin coincidir subcadenas si es posible, o al menos lowercase
      if (just.toLowerCase().includes(word)) {
        if (uncertaintyIncidences < 4) { // Max 4 incidences = -0.12
          penalties.push({
            reason: `lenguaje_incertidumbre_${word.replace(/\s+/g, '_')}`,
            factor: f,
            deduction: -0.03
          });
          currentConfidence -= 0.03;
          uncertaintyIncidences++;
        }
      }
    });

    // 3. Falta de citas textuales (usamos comillas dobles o simples como indicador simple)
    const hasQuotes = /["'](.*?)["']/.test(just);
    if (!hasQuotes) {
      penalties.push({
        reason: 'falta_cita_textual',
        factor: f,
        deduction: -0.05
      });
      currentConfidence -= 0.05;
    } else {
      // Extraer lo que está en comillas como evidencia
      const matches = just.match(/(["'])(.*?)\1/g);
      if (matches) {
        matches.forEach((m: string) => evidenceFound.push(m));
      }
    }
  });

  // 4. Incoherencias lógicas entre factores (Cross-Factor Coherence)
  const evalData = report.evaluacion || {};
  const sup = evalData.supervision || 1;
  const dif = evalData.dificultad || 1;
  const resp = evalData.responsabilidad || 1;
  const req = evalData.requisitos || 1;

  if (sup >= 4 && dif <= 2) {
    penalties.push({
      reason: 'incoherencia_logica_supervision_alta_dificultad_baja',
      deduction: -0.15
    });
    currentConfidence -= 0.15;
  }

  if (req >= 4 && resp <= 1) {
    penalties.push({
      reason: 'incoherencia_logica_requisitos_altos_responsabilidad_baja',
      deduction: -0.15
    });
    currentConfidence -= 0.15;
  }

  // Ensure confidence is between 0 and 1
  currentConfidence = Math.max(0, Math.min(1, currentConfidence));

  // Redondear a 2 decimales para evitar floating point issues
  currentConfidence = Math.round(currentConfidence * 100) / 100;

  const breakdown: ConfidenceBreakdown = {
    base: baseConfidence,
    penalties,
    final: currentConfidence,
    reasoning: motor === 'rule-based' ? 'El motor rule-based tiene un techo de 0.90 debido a que usa heurísticas que no pueden igualar el análisis semántico profundo de un LLM.' : 'Análisis realizado por motor LLM.'
  };

  return {
    confidence: currentConfidence,
    breakdown,
    isValid: currentConfidence >= 0.60,
    evidenceFound
  };
}
