const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.puesto.count()
  .then(count => console.log('PUESTOS COUNT:', count))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
