const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedVP() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No users found to assign the VP creation.');
    return;
  }

  const vp = await prisma.valorPunto.create({
    data: {
      periodo: '2024',
      total_salarios: 50000000,
      total_puntos: 40000,
      valor_punto_exacto: 1250.00,
      valor_punto_aplicado: 1277.50,
      puestos_clave_usados: 10,
      calculado_por: user.id,
      fecha_vigencia_inicio: new Date(),
    }
  });
  console.log('ValorPunto seeded:', vp);
}

seedVP().then(() => prisma.$disconnect());
