const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const manualCount = await prisma.manualEnriquecido.count();
    const puestosCount = await prisma.puesto.count();
    const catalogCount = await prisma.catalogoPuesto.count();
    
    console.log('ManualEnriquecido count:', manualCount);
    console.log('Puesto count:', puestosCount);
    console.log('CatalogoPuesto count:', catalogCount);
    
    if (manualCount > 0) {
      const first = await prisma.manualEnriquecido.findFirst();
      console.log('First ManualEnriquecido:', JSON.stringify(first, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
