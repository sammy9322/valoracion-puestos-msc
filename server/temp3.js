const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const cargos = await prisma.manualEnriquecido.findMany();
  console.log('Total in DB:', cargos.length);
  const a = cargos.find(c => c.nombre_pdf.includes('Asistente de Control Interno'));
  if (a) {
    console.log('FOUND:', a.nombre_pdf);
    console.log(JSON.parse(a.funciones));
  } else {
    console.log('NOT FOUND');
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
