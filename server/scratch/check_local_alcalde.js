import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inspect() {
  const cargo = await prisma.manualEnriquecido.findFirst({
    where: { cargo: { contains: 'Alcalde' } }
  });

  if (cargo) {
    console.log('Local ManualEnriquecido - Alcalde:');
    console.log('Cargo:', cargo.cargo);
    console.log('Funciones:', cargo.funciones);
    console.log('Estrato:', cargo.estrato);
  } else {
    console.log('Alcalde not found in local ManualEnriquecido');
  }
  await prisma.$disconnect();
}

inspect();
