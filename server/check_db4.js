const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.catalogoPuesto.groupBy({
  by: ['nombre'],
  _count: { nombre: true },
  orderBy: { _count: { nombre: 'desc' } },
  take: 10
})
  .then(res => console.log(res))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
