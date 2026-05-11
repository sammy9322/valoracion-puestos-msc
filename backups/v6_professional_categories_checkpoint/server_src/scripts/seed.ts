import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando limpieza general y poblado de Base de Datos sintética (Datos Reales Promediados de Muni CR)...');

  // Limpiar BD
  await prisma.asignacionSalario.deleteMany();
  await prisma.valorPunto.deleteMany();
  await prisma.encuestaSalarios.deleteMany();
  await prisma.evaluacion.deleteMany();
  await prisma.puesto.deleteMany();
  await prisma.user.deleteMany();

  // 1. Crear un evaluador admin maestro
  const user = await prisma.user.create({
    data: {
      nombre: 'Administrador Muni',
      email: 'admin@msc.go.cr',
      password: 'scraped_admin_pass',
      rol: 'SUPER_ADMIN'
    }
  });

  // Data de las Municipalidades
  const roles = [
    {
      nombre: 'Asistente de Control Interno',
      area: 'Auditoría',
      reporta_a: 'Auditor Interno',
      descripcion: 'Asistir técnica y administrativamente en las labores de análisis, evaluación y monitoreo del Sistema de Control Interno Municipal, bajo apego a la Ley General de Control Interno (LGCI N°8292).',
      edu: 'Diplomado o Bachillerato Univ.',
      exp: '1 a 2 años',
      clave: true,
      
      dificultad: { grado: 4, puntos: 90, just: 'Requiere aplicar lógica de auditoría a múltiples áreas operativas y conocer reglamentos de la CGR.' },
      supervision: { grado: 2, puntos: 40, just: 'Recibe directrices específicas pero tiene autonomía en el levantamiento de informes.' },
      responsabilidad: { grado: 3, puntos: 65, just: 'Maneja información sensible y recomienda correcciones sobre procesos financieros.' },
      condiciones: { grado: 2, puntos: 45, just: 'Trabajo de oficina regular con salidas a inspeccionar campos operativos.' },
      consecuencia: { grado: 4, puntos: 85, just: 'Un error puede dejar un desfase legal o financiero desatendido, provocando llamadas de atención de la CGR.' },
      requisitos: { grado: 4, puntos: 85, just: 'Dominio de NIIF, redacción técnica y leyes administrativas.' },
      puntos_totales: 410,
      
      encuesta: { min: 450000, prom: 585000, max: 700000, fte: 'Colegio de CPA y MTSS Técnico' }
    },
    {
      nombre: 'Conserje de Vías Públicas',
      area: 'Desarrollo Urbano (Aseo)',
      reporta_a: 'Jefatura de Obras',
      descripcion: 'Labores físicas y manuales de aseo, limpieza y ornato en calles, parques y caños del cantón.',
      edu: 'Primaria Completa',
      exp: 'Sin experiencia previa exigida',
      clave: true,

      dificultad: { grado: 1, puntos: 15, just: 'Trabajo físico rutinario bajo instrucciones repetitivas.' },
      supervision: { grado: 1, puntos: 15, just: 'Supervisión constante y revisión de metas diarias de limpieza.' },
      responsabilidad: { grado: 1, puntos: 15, just: 'Responsabilidad por equipo menor (Escoba, pala, carretillo).' },
      condiciones: { grado: 4, puntos: 110, just: 'Trabajo directo bajo el sol, lluvia, ruidos y exposición vial.' },
      consecuencia: { grado: 1, puntos: 15, just: 'Su error implica el repaso de una zona, no genera costo legal/financiero.' },
      requisitos: { grado: 1, puntos: 15, just: 'Lecto-escritura básica.' },
      puntos_totales: 185,

      encuesta: { min: 350000, prom: 352165, max: 400000, fte: 'Decreto MTSS Salarios Mínimos (Tit. I)' }
    },
    {
      nombre: 'Director Financiero / Hacienda',
      area: 'Hacienda Municipal',
      reporta_a: 'Alcalde Municipal',
      descripcion: 'Dirigir, planificar y supervisar la formulación presupuestaria, ingresos y egresos municipales, rindiendo cuentas directas a Alcaldía y Concejo.',
      edu: 'Licenciatura en Economía/Finanzas',
      exp: '3 a 5 años en puestos Jefatura',
      clave: true,

      dificultad: { grado: 6, puntos: 145, just: 'Exige soluciones estratégicas a problemas altamente complejos en finanzas públicas.' },
      supervision: { grado: 6, puntos: 140, just: 'Nulo control ejercido sobre él salvo jerarquía Alcaldía. Coordina múltiples departamentos.' },
      responsabilidad: { grado: 6, puntos: 190, just: 'Responsabilidad suprema sobre flujos de miles de millones de colones.' },
      condiciones: { grado: 1, puntos: 20, just: 'Labor administrativa y cómoda, estrés ejecutivo.' },
      consecuencia: { grado: 6, puntos: 145, just: 'Un error financiero puede causar el congelamiento de fondos del Estado o procesos penales por peculado.' },
      requisitos: { grado: 6, puntos: 140, just: 'Incorporación a colegios profesionales y vasta experiencia en SICOP/Presupuestos Públicos.' },
      puntos_totales: 780,

      encuesta: { min: 1000000, prom: 1450000, max: 2100000, fte: 'Sondeo Muni Cartago/Alajuela 2024' }
    }
  ];

  for (const info of roles) {
    console.log('Creando puesto:', info.nombre);
    
    const puesto = await prisma.puesto.create({
      data: {
        nombre: info.nombre,
        area: info.area,
        reporta_a: info.reporta_a,
        descripcion_funciones: info.descripcion,
        educacion_requerida: info.edu,
        experiencia_requerida: info.exp,
        es_puesto_clave: info.clave,
        estado: 'evaluado',
      }
    });

    await prisma.evaluacion.create({
      data: {
        puesto_id: puesto.id,
        periodo: "2024",
        evaluador_id: user.id,
        puntos_totales: info.puntos_totales,
        estado: "aprobada",
        
        grado_dificultad: info.dificultad.grado, puntos_dificultad: info.dificultad.puntos, justif_dificultad: info.dificultad.just,
        grado_supervision: info.supervision.grado, puntos_supervision: info.supervision.puntos, justif_supervision: info.supervision.just,
        grado_responsabilidad: info.responsabilidad.grado, puntos_responsabilidad: info.responsabilidad.puntos, justif_responsabilidad: info.responsabilidad.just,
        grado_condiciones: info.condiciones.grado, puntos_condiciones: info.condiciones.puntos, justif_condiciones: info.condiciones.just,
        grado_consecuencia_error: info.consecuencia.grado, puntos_consecuencia_error: info.consecuencia.puntos, justif_consecuencia_error: info.consecuencia.just,
        grado_requisitos: info.requisitos.grado, puntos_requisitos: info.requisitos.puntos, justif_requisitos: info.requisitos.just,
      }
    });

    await prisma.encuestaSalarios.create({
      data: {
        puesto_id: puesto.id,
        periodo: "2024",
        salario_minimo: info.encuesta.min,
        salario_promedio: info.encuesta.prom,
        salario_maximo: info.encuesta.max,
        mediana: info.encuesta.prom,
        moda: info.encuesta.prom,
        fuente: info.encuesta.fte,
      }
    });
  }

  console.log('--- SEED COMPLETADO. Entra a "Cálculo VP" para ver la magia de los datos en tiempo real ---');
}

main().catch(console.error);
