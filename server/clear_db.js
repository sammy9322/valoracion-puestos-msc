const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.catalogoPuesto.deleteMany()
  .then(res => console.log('Borrados:', res.count))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
