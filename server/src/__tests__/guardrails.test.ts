import { describe, it, expect } from 'vitest';
import { validateObjectivity } from '../services/guardrails';
import { ValuationReportSchema } from '../services/outputValidator';

const reporteBase = {
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

describe('guardrails: validateObjectivity', () => {
  it('marca el lenguaje especulativo en las justificaciones', () => {
    // "Probablemente" no es lenguaje admisible en un dictamen vinculante.
    const r = validateObjectivity(reporteBase);
    expect(r.isValid).toBe(false);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('acepta un reporte con justificaciones objetivas', () => {
    const limpio = {
      ...reporteBase,
      evaluacion: {
        ...reporteBase.evaluacion,
        dificultad_just: 'Realiza tareas variadas y estandarizadas según la descripción de funciones.'
      }
    };
    expect(validateObjectivity(limpio).isValid).toBe(true);
  });

  it('rechaza un grado fuera del rango 1-5', () => {
    const fueraDeRango = {
      ...reporteBase,
      evaluacion: { ...reporteBase.evaluacion, dificultad: 6 }
    };
    const r = validateObjectivity(fueraDeRango);
    expect(r.isValid).toBe(false);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe('outputValidator: ValuationReportSchema', () => {
  it('rechaza justificaciones sin evidencia suficiente', () => {
    const justificacionCorta = {
      ...reporteBase,
      evaluacion: { ...reporteBase.evaluacion, dificultad_just: 'Corto.' }
    };
    expect(ValuationReportSchema.safeParse(justificacionCorta).success).toBe(false);
  });
});
