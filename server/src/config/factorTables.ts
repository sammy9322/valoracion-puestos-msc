export const FACTOR_CONFIG = {
  dificultad: {
    label: 'Dificultad de Funciones', maxPts: 150,
    ranges: [[0,0], [0,25], [30,50], [55,75], [80,100], [105,130], [135,150]],
    grades: ['', 'Tareas simples y repetitivas, poca iniciativa.', 'Tareas variadas pero estandarizadas.', 'Requiere análisis y juicio para resolver problemas técnicos.', 'Alta complejidad, planeación y coordinación institucional.', 'Dirección estratégica y toma de decisiones críticas.', 'Análisis y solución de problemas sin precedentes.']
  },
  supervision: {
    label: 'Supervisión Ejercida', maxPts: 150,
    ranges: [[0,0], [5,25], [30,50], [55,75], [80,100], [105,125], [130,150]],
    grades: ['', 'No ejerce supervisión.', 'Supervisión ocasional de tareas simples.', 'Supervisión de un grupo de trabajo operativo.', 'Jefatura de una unidad o departamento.', 'Dirección de un área técnica o administrativa mayor.', 'Coordina programas de alto nivel, autonomía completa.']
  },
  responsabilidad: {
    label: 'Responsabilidad', maxPts: 200,
    ranges: [[0,0], [0,25], [30,50], [55,75], [80,100], [105,150], [160,200]],
    grades: ['', 'Baja responsabilidad por valores o equipo.', 'Responsabilidad moderada por materiales y herramientas.', 'Custodia de información sensible o fondos fijos.', 'Responsabilidad por presupuestos o activos de alto valor.', 'Responsabilidad total por la gestión de un proceso clave.', 'Responsabilidad completa de unidad y decisiones trascendentales.']
  },
  condiciones: {
    label: 'Condiciones de Trabajo', maxPts: 150,
    ranges: [[0,0], [5,30], [35,60], [65,90], [95,120], [125,150]],
    grades: ['', 'Ambiente de oficina normal, riesgos mínimos.', 'Esfuerzo físico moderado o ambiente algo incómodo.', 'Exposición a condiciones climáticas o ruido constante.', 'Riesgo de accidentes laborales o manejo de químicos.', 'Condiciones de alta peligrosidad o insalubridad constante.']
  },
  error: {
    label: 'Consecuencia del Error', maxPts: 150,
    ranges: [[0,0], [0,25], [30,50], [55,75], [80,100], [105,125], [130,150]],
    grades: ['', 'Error fácil de detectar y corregir.', 'Error causa retrasos menores en el flujo de trabajo.', 'Error afecta a otros departamentos o al servicio al cliente.', 'Error causa pérdidas económicas o legales significativas.', 'Error compromete la estabilidad institucional o seguridad pública.', 'Decisiones críticas; el error causa daños irreversibles institucionales.']
  },
  requisitos: {
    label: 'Requisitos', maxPts: 150,
    ranges: [[0,0], [5,20], [25,45], [50,75], [80,100], [105,125], [130,150]],
    grades: ['', 'Educación básica o primaria.', 'Bachillerato en Educación Media o Técnico básico.', 'Diplomado o Técnico superior especializado.', 'Bachillerato Universitario o Licenciatura profesional.', 'Grado de Maestría o especialización avanzada requerida.', 'Postgrado avanzado y madurez profesional crítica.']
  }
};

export const POINTS_MAP = Object.fromEntries(
  Object.entries(FACTOR_CONFIG).map(([k, v]) => [k, v.ranges.map(([min, max]) => Math.round((min + max) / 2))])
);

export type Intensidad = 'bajo' | 'medio' | 'alto';

export function getFactorPoints(factor: string, grado: number, intensidad: Intensidad = 'medio'): number {
  const config = (FACTOR_CONFIG as any)[factor];
  if (!config || !config.ranges[grado]) return 0;
  const [min, max] = config.ranges[grado];
  if (intensidad === 'bajo') return min;
  if (intensidad === 'alto') return max;
  return Math.round((min + max) / 2);
}
