/**
 * MATRIZ TÉCNICA DE VALORACIÓN POR PUNTOS
 * Basada en los Manuales de la Dirección General de Servicio Civil (Costa Rica)
 * Adaptada para la Municipalidad de San Carlos.
 */

export interface MatrixOption {
  label: string;
  points: number;
  description: string;
}

export interface SubFactor {
  id: string;
  name: string;
  options: MatrixOption[];
}

export interface FactorMatrix {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  subfactors: SubFactor[];
}

export const EVALUACION_MATRIX: FactorMatrix[] = [
  {
    id: 'dificultad',
    name: '1. Dificultad de la Labor',
    description: 'Mide la complejidad, autonomía e iniciativa requerida para el desempeño del puesto.',
    maxPoints: 150,
    subfactors: [
      {
        id: 'complejidad',
        name: 'Complejidad de Tareas',
        options: [
          { label: 'Rutinario', points: 10, description: 'Tareas simples y repetitivas, instrucciones precisas.' },
          { label: 'Variado', points: 20, description: 'Tareas diversas que requieren alguna interpretación.' },
          { label: 'Especializado', points: 30, description: 'Procedimientos técnicos que requieren análisis de variables.' },
          { label: 'Complejo', points: 40, description: 'Análisis profundo, diagnóstico y resolución de problemas técnicos.' },
          { label: 'Estratégico', points: 50, description: 'Planificación global, alta abstracción y conceptualización.' }
        ]
      },
      {
        id: 'autonomia',
        name: 'Autonomía',
        options: [
          { label: 'Bajo Control', points: 10, description: 'Revisión constante del trabajo durante su ejecución.' },
          { label: 'Supervisión Periódica', points: 20, description: 'Se revisan resultados finales de tareas cortas.' },
          { label: 'Autonomía Operativa', points: 30, description: 'Responsable de procesos completos, revisión por resultados.' },
          { label: 'Autonomía Técnica', points: 40, description: 'Decisiones técnicas sin revisión inmediata.' },
          { label: 'Dirección General', points: 50, description: 'Nivel ejecutivo, rinde cuentas solo sobre metas institucionales.' }
        ]
      },
      {
        id: 'iniciativa',
        name: 'Iniciativa y Originalidad',
        options: [
          { label: 'Mínima', points: 10, description: 'Sigue métodos establecidos estrictamente.' },
          { label: 'Adaptativa', points: 20, description: 'Realiza ajustes menores a métodos existentes.' },
          { label: 'Proactiva', points: 30, description: 'Sugiere mejoras significativas a procesos.' },
          { label: 'Creativa', points: 40, description: 'Desarrolla nuevas soluciones y procedimientos técnicos.' },
          { label: 'Innovadora', points: 50, description: 'Crea políticas, estrategias y modelos institucionales.' }
        ]
      }
    ]
  },
  {
    id: 'supervision',
    name: '2. Supervisión',
    description: 'Mide el grado de independencia (recibida) y la responsabilidad sobre personal (ejercida).',
    maxPoints: 150,
    subfactors: [
      {
        id: 'sup_recibida',
        name: 'Supervisión Recibida (Independencia)',
        options: [
          { label: 'Constante', points: 10, description: 'Instrucciones detalladas en cada paso.' },
          { label: 'Frecuente', points: 25, description: 'Instrucciones sobre métodos de trabajo.' },
          { label: 'General', points: 40, description: 'Guías generales de acción y objetivos.' },
          { label: 'Mínima', points: 60, description: 'Define sus propios planes de acción.' },
          { label: 'Independiente', points: 75, description: 'Autonomía total en la gestión del área.' }
        ]
      },
      {
        id: 'sup_ejercida',
        name: 'Supervisión Ejercida (Liderazgo)',
        options: [
          { label: 'No ejerce', points: 0, description: 'No tiene personal a cargo.' },
          { label: 'Coordinador', points: 20, description: 'Coordina tareas de un grupo pequeño.' },
          { label: 'Jefatura Operativa', points: 40, description: 'Supervisa directamente la ejecución de un grupo.' },
          { label: 'Dirección de Sección', points: 60, description: 'Dirige y evalúa el trabajo de varias unidades.' },
          { label: 'Dirección de Área', points: 75, description: 'Responsable máximo de personal y clima organizacional.' }
        ]
      }
    ]
  },
  {
    id: 'responsabilidad',
    name: '3. Responsabilidad',
    description: 'Compromiso sobre bienes, relaciones humanas e información confidencial.',
    maxPoints: 200,
    subfactors: [
      {
        id: 'valores',
        name: 'Valores, Equipo y Materiales',
        options: [
          { label: 'Menores', points: 10, description: 'Equipo de oficina básico, útiles.' },
          { label: 'Moderados', points: 25, description: 'Equipo especializado o manejo de caja chica.' },
          { label: 'Importantes', points: 45, description: 'Maquinaria pesada, fondos institucionales medianos.' },
          { label: 'Críticos', points: 60, description: 'Grandes sumas de dinero, tesorería o activos fijos masivos.' },
          { label: 'Patrimoniales', points: 70, description: 'Custodia legal y total del patrimonio institucional.' }
        ]
      },
      {
        id: 'relaciones',
        name: 'Relaciones de Trabajo',
        options: [
          { label: 'Internas Simples', points: 10, description: 'Trato solo con compañeros de unidad.' },
          { label: 'Internas Diversas', points: 25, description: 'Contacto con múltiples departamentos municipales.' },
          { label: 'Público General', points: 40, description: 'Atención directa y resolución a ciudadanos.' },
          { label: 'Entidades Externas', points: 50, description: 'Negociación con ministerios, CGR, bancos.' },
          { label: 'Representación Legal', points: 60, description: 'Representa a la Alcaldía ante entes nacionales/internacionales.' }
        ]
      },
      {
        id: 'informacion',
        name: 'Información Confidencial',
        options: [
          { label: 'Baja', points: 10, description: 'Acceso a datos de uso público.' },
          { label: 'Moderada', points: 25, description: 'Archivos internos no públicos.' },
          { label: 'Alta', points: 40, description: 'Datos protegidos por ley (Ley 8968).' },
          { label: 'Estratégica', points: 55, description: 'Planes de seguridad, auditorías en proceso.' },
          { label: 'Reservación Total', points: 70, description: 'Información de máxima seguridad institucional.' }
        ]
      }
    ]
  },
  {
    id: 'condiciones',
    name: '4. Condiciones de Trabajo',
    description: 'Esfuerzo físico y condiciones del entorno laboral.',
    maxPoints: 150,
    subfactors: [
      {
        id: 'riesgo',
        name: 'Riesgos Laborales',
        options: [
          { label: 'Mínimo', points: 10, description: 'Oficina estandard, bajo riesgo físico.' },
          { label: 'Moderado', points: 25, description: 'Salidas a campo, exposición a tránsito.' },
          { label: 'Importante', points: 45, description: 'Manejo de químicos, altura o maquinaria peligrosa.' },
          { label: 'Alto', points: 60, description: 'Exposición a agentes biológicos o entornos violentos.' },
          { label: 'Crítico', points: 75, description: 'Peligro latente para la integridad física permanente.' }
        ]
      },
      {
        id: 'ambiente',
        name: 'Ambiente y Esfuerzo Físico',
        options: [
          { label: 'Cómodo', points: 10, description: 'Ambiente climatizado, poco esfuerzo físico.' },
          { label: 'Variable', points: 25, description: 'Cambios de temperatura, caminatas medias.' },
          { label: 'Incómodo', points: 45, description: 'Ruidos, polvo, exposición al sol/lluvia frecuente.' },
          { label: 'Pesado', points: 60, description: 'Carga de objetos pesados, posturas forzadas.' },
          { label: 'Extremo', points: 75, description: 'Condiciones insalubres o esfuerzo físico agotador sostenido.' }
        ]
      }
    ]
  },
  {
    id: 'consecuencia_error',
    name: '5. Consecuencia del Error',
    description: 'Magnitud del impacto provocado por fallas en el desempeño.',
    maxPoints: 150,
    subfactors: [
      {
        id: 'imp_institucional',
        name: 'Impacto Interno / Operativo',
        options: [
          { label: 'Repasable', points: 10, description: 'Causa atrasos menores fácilmente corregibles.' },
          { label: 'Notable', points: 25, description: 'Afecta la meta de una semana de la unidad.' },
          { label: 'Grave', points: 45, description: 'Pérdida de materiales o daño a equipos valiosos.' },
          { label: 'Crítico', points: 60, description: 'Afectación del servicio público municipal masivo.' },
          { label: 'Institucional', points: 75, description: 'Pone en riesgo la estabilidad de la Municipalidad.' }
        ]
      },
      {
        id: 'imp_legal',
        name: 'Impacto Legal / Patrimonial',
        options: [
          { label: 'Nulo', points: 10, description: 'Sin implicaciones legales.' },
          { label: 'Administrativo', points: 25, description: 'Sanciones disciplinarias internas.' },
          { label: 'Civil', points: 45, description: 'Demandas contra la institución.' },
          { label: 'Económico', points: 60, description: 'Multas pesadas de la CGR o pérdida de transferencias.' },
          { label: 'Penal', points: 75, description: 'Responsabilidades penales y daño reputacional extremo.' }
        ]
      }
    ]
  },
  {
    id: 'requisitos',
    name: '6. Requisitos',
    description: 'Educación formal y experiencia mínima necesaria.',
    maxPoints: 200,
    subfactors: [
      {
        id: 'educacion',
        name: 'Preparación Académica',
        options: [
          { label: 'Primaria / Básica', points: 20, description: 'Saber leer y escribir o primaria completa.' },
          { label: 'Secundaria / Técnico', points: 40, description: 'Bachiller en secundaria o Técnico medio.' },
          { label: 'Diplomado / Parauniv.', points: 60, description: 'Cursos técnicos superiores o Diplomado.' },
          { label: 'Bachiller Univ.', points: 80, description: 'Título universitario de primer grado.' },
          { label: 'Licenciatura / Post', points: 100, description: 'Licenciatura, Maestría o incorporación a Colegio.' }
        ]
      },
      {
        id: 'experiencia',
        name: 'Experiencia Laboral',
        options: [
          { label: 'Sin experiencia', points: 20, description: '0 a 6 meses de labores similares.' },
          { label: '6m a 2 años', points: 40, description: 'Experiencia técnica básica.' },
          { label: '2 a 4 años', points: 60, description: 'Experiencia sólida en el área de especialidad.' },
          { label: '4 a 6 años', points: 80, description: 'Experiencia en cargos de mando o alta técnica.' },
          { label: 'Más de 6 años', points: 100, description: 'Trayectoria probada y experta en el campo.' }
        ]
      }
    ]
  }
];
