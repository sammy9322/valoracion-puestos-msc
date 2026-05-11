const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.catalogoPuesto.count();
  console.log('Total en CatalogoPuesto (local/PDF):', count);

  // Muestra los primeros 10 nombres para verificar calidad
  const sample = await prisma.catalogoPuesto.findMany({ take: 10, select: { nombre: true, es_vigente: true } });
  console.log('Muestra:', JSON.stringify(sample, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
