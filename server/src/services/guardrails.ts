import { HEURISTIC_RULES } from '../config/heuristicRules';

export function validateObjectivity(report: any): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const allText = JSON.stringify(report).toLowerCase();

  HEURISTIC_RULES.uncertaintyKeywords.forEach(word => {
    if (allText.includes(word)) {
      warnings.push(`Se detectó lenguaje de incertidumbre: "${word}"`);
    }
  });

  // Validation of coherence between points and grades
  const factors = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];
  factors.forEach(f => {
    const grade = report.evaluacion?.[f];
    if (grade && (grade < 1 || grade > 5)) {
      warnings.push(`Grado fuera de rango para factor ${f}: ${grade}`);
    }
  });

  return {
    isValid: warnings.length === 0,
    warnings
  };
}
