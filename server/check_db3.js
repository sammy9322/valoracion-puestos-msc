const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.catalogoPuesto.findMany({ take: 20 })
  .then(res => console.log(res.map(r => r.nombre)))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
