const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const cargos = await prisma.manualEnriquecido.findMany({
    where: { nombre_pdf: { contains: 'Control Interno' } }
  });
  if (cargos.length > 0) {
    console.log(JSON.parse(cargos[0].funciones));
  } else {
    console.log("NOT FOUND in Prisma");
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
