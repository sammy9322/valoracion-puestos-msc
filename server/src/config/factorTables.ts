export const FACTOR_CONFIG = {
  dificultad: {
    label: 'Dificultad de Funciones',
    maxPts: 200,
    points: [0, 40, 80, 120, 160, 200],
    grades: [
      '',
      'Tareas simples y repetitivas, poca iniciativa.',
      'Tareas variadas pero estandarizadas.',
      'Requiere análisis y juicio para resolver problemas técnicos.',
      'Alta complejidad, planeación y coordinación institucional.',
      'Dirección estratégica y toma de decisiones críticas.'
    ]
  },
  supervision: {
    label: 'Supervisión Ejercida',
    maxPts: 150,
    points: [0, 30, 60, 90, 120, 150],
    grades: [
      '',
      'No ejerce supervisión.',
      'Supervisión ocasional de tareas simples.',
      'Supervisión de un grupo de trabajo operativo.',
      'Jefatura de una unidad o departamento.',
      'Dirección de un área técnica o administrativa mayor.'
    ]
  },
  responsabilidad: {
    label: 'Responsabilidad',
    maxPts: 200,
    points: [0, 40, 80, 120, 160, 200],
    grades: [
      '',
      'Baja responsabilidad por valores o equipo.',
      'Responsabilidad moderada por materiales y herramientas.',
      'Custodia de información sensible o fondos fijos.',
      'Responsabilidad por presupuestos o activos de alto valor.',
      'Responsabilidad total por la gestión de un proceso clave.'
    ]
  },
  condiciones: {
    label: 'Condiciones de Trabajo',
    maxPts: 100,
    points: [0, 20, 40, 60, 80, 100],
    grades: [
      '',
      'Ambiente de oficina normal, riesgos mínimos.',
      'Esfuerzo físico moderado o ambiente algo incómodo.',
      'Exposición a condiciones climáticas o ruido constante.',
      'Riesgo de accidentes laborales o manejo de químicos.',
      'Condiciones de alta peligrosidad o insalubridad constante.'
    ]
  },
  error: {
    label: 'Consecuencia del Error',
    maxPts: 150,
    points: [0, 30, 60, 90, 120, 150],
    grades: [
      '',
      'Error fácil de detectar y corregir.',
      'Error causa retrasos menores en el flujo de trabajo.',
      'Error afecta a otros departamentos o al servicio al cliente.',
      'Error causa pérdidas económicas o legales significativas.',
      'Error compromete la estabilidad institucional o seguridad pública.'
    ]
  },
  requisitos: {
    label: 'Requisitos',
    maxPts: 200,
    points: [0, 40, 80, 120, 160, 200],
    grades: [
      '',
      'Educación básica o primaria.',
      'Bachillerato en Educación Media o Técnico básico.',
      'Diplomado o Técnico superior especializado.',
      'Bachillerato Universitario o Licenciatura profesional.',
      'Grado de Maestría o especialización avanzada requerida.'
    ]
  }
};

export const POINTS_MAP = Object.fromEntries(
  Object.entries(FACTOR_CONFIG).map(([k, v]) => [k, v.points])
);

export type Intensidad = 'bajo' | 'medio' | 'alto';

export function getFactorPoints(factor: string, grado: number, intensidad: Intensidad = 'medio'): number {
  const points = POINTS_MAP[factor];
  if (!points) return 0;
  const base = points[grado] ?? 0;
  if (intensidad === 'alto') {
    const next = points[Math.min(grado + 1, points.length - 1)] ?? base;
    return Math.round((base + next) / 2);
  }
  if (intensidad === 'bajo') {
    const prev = points[Math.max(1, grado - 1)] ?? 0;
    return Math.round((prev + base) / 2);
  }
  return base;
}
