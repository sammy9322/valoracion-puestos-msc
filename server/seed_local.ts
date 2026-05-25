import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/db';

async function main() {
  console.log('Seeding local PostgreSQL database...');

  // 1. Crear el usuario administrador por defecto
  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@msc.go.cr' }
  });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        nombre: 'Evaluador Admin',
        email: 'admin@msc.go.cr',
        password: 'mock_password',
        rol: 'ADMIN'
      }
    });
    console.log('Admin user created:', adminUser.email);
  } else {
    console.log('Admin user already exists');
  }

  // 2. Crear los puestos de prueba
  const puestosMock = [
    {
      nombre: 'Asistente de Control Interno',
      area: 'Control Interno',
      reporta_a: 'Coordinador de Control Interno',
      descripcion_funciones: '• Asistir en los procesos de valoración de riesgos de la institución. Colaborar en los procesos de investigación, construir las herramientas necesarias que faciliten el cumplir con la normativa en lo referente a ambiente de control, valoración del riesgo, actividades de control, sistemas de información, así como seguimientos del sistema. También deberá asistir en el establecimiento de instrumentos que garanticen un sistema de evaluación de control interno. Prestar colaboración en la elaboración de manuales de procedimientos. Desarrollar actividades para implementar y mejorar un sistema de gestión de calidad.\n• Participar en la preparación de informes especiales de Relaciones de Hechos o Denuncias Penales producto de una investigación, y presentar a Control Interno.',
      educacion_requerida: 'Bachiller universitario en una carrera atinente al cargo',
      experiencia_requerida: 'Experiencia en control interno o auditoría',
      codigo_clase_msc: 'Profesional Municipal 4',
      es_puesto_clave: true,
      estado: 'borrador'
    },
    {
      nombre: 'Auxiliar Administrativo de Cobros',
      area: 'Tributos',
      reporta_a: 'Jefe de Cobros',
      descripcion_funciones: '• Atender al público en consultas de deudas tributarias.\n• Recibir correspondencia, archivar documentos y emitir estados de cuenta.\n• Colaborar en la gestión telefónica de cobro administrativo.',
      educacion_requerida: 'Bachillerato en educación media',
      experiencia_requerida: '1 año en puestos de servicio al cliente o auxiliar administrativo',
      codigo_clase_msc: 'Auxiliar Administrativo 1',
      es_puesto_clave: false,
      estado: 'borrador'
    },
    {
      nombre: 'Jefe de Tecnologías de Información',
      area: 'Tecnologías de Información',
      reporta_a: 'Director(a) Administrativo(a)',
      descripcion_funciones: '• Dirigir los planes de innovación y transformación digital de la Municipalidad.\n• Planificar la seguridad de la información, infraestructura técnica y desarrollo de software interno.\n• Coordinar el equipo técnico y asegurar la continuidad operativa de los sistemas.',
      educacion_requerida: 'Licenciatura universitaria en Ingeniería de Sistemas, Informática o similar, y miembro activo del colegio profesional respectivo',
      experiencia_requerida: '3 años de experiencia liderando departamentos de tecnología o coordinando proyectos complejos',
      codigo_clase_msc: 'Profesional Jefe 1',
      es_puesto_clave: true,
      estado: 'borrador'
    }
  ];

  for (const p of puestosMock) {
    const existing = await prisma.puesto.findFirst({
      where: { nombre: p.nombre, area: p.area }
    });
    if (!existing) {
      const created = await prisma.puesto.create({
        data: p
      });
      console.log('Puesto created:', created.nombre);
    } else {
      console.log('Puesto already exists:', p.nombre);
    }
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
