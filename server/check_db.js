const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.catalogoPuesto.count()
  .then(count => console.log('COUNT:', count))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
