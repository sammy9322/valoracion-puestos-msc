import { validateObjectivity } from '../services/guardrails';
import { ValuationReportSchema } from '../services/outputValidator';

// Test 1: Report with uncertainty language
const reportWithUncertainty = {
  puesto_id: 'test-1',
  totalPuntos: 200,
  evaluacion: {
    dificultad: 2,
    dificultad_just: 'Probablemente realiza tareas variadas.',
    supervision: 1,
    supervision_just: 'No ejerce supervisión.',
    responsabilidad: 1,
    responsabilidad_just: 'Baja responsabilidad.',
    condiciones: 1,
    condiciones_just: 'Oficina normal.',
    error: 1,
    error_just: 'Error fácil de corregir.',
    requisitos: 1,
    requisitos_just: 'Educación básica.',
  },
  auditoria: {
    motor: 'test',
    buildVersion: 'test',
    timestamp: new Date().toISOString(),
    confidence: 0.9,
    evidenceFound: []
  }
};

const result1 = validateObjectivity(reportWithUncertainty);
console.log('Test 1 - Uncertainty detection:', result1.isValid ? 'FAIL (should have warnings)' : 'PASS');
if (result1.warnings.length > 0) {
  console.log('  Warnings found:', result1.warnings);
}

// Test 2: Clean report (no uncertainty)
const cleanReport = {
  ...reportWithUncertainty,
  evaluacion: {
    ...reportWithUncertainty.evaluacion,
    dificultad_just: 'Realiza tareas variadas y estandarizadas según la descripción de funciones.'
  }
};
const result2 = validateObjectivity(cleanReport);
console.log('Test 2 - Clean report:', result2.isValid ? 'PASS' : 'FAIL');

// Test 3: Invalid grade (out of range)
const invalidGradeReport = {
  ...reportWithUncertainty,
  evaluacion: {
    ...reportWithUncertainty.evaluacion,
    dificultad: 6
  }
};
const result3 = validateObjectivity(invalidGradeReport);
console.log('Test 3 - Out of range grade:', result3.isValid ? 'FAIL (should have warnings)' : 'PASS');
if (result3.warnings.length > 0) {
  console.log('  Warnings found:', result3.warnings);
}

// Test 4: Insufficient evidence (very short justification)
const shortJustReport = {
  ...reportWithUncertainty,
  evaluacion: {
    ...reportWithUncertainty.evaluacion,
    dificultad_just: 'Corto.'
  }
};
const zodResult = ValuationReportSchema.safeParse(shortJustReport);
console.log('Test 4 - Insufficient evidence:', zodResult.success ? 'FAIL (should fail validation)' : 'PASS');

// Summary
console.log('\n=== Summary ===');
const tests = [
  { name: 'Uncertainty detection', pass: !result1.isValid },
  { name: 'Clean report', pass: result2.isValid },
  { name: 'Out of range grade', pass: !result3.isValid },
  { name: 'Insufficient evidence', pass: !zodResult.success },
];
tests.forEach(t => console.log(`${t.pass ? '✓' : '✗'} ${t.name}`));
const allPass = tests.every(t => t.pass);
console.log(`\n${allPass ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
process.exit(allPass ? 0 : 1);
