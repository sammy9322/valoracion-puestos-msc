const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedUser() {
  const user = await prisma.user.create({
    data: {
      email: 'admin@msc.go.cr',
      password: 'password123',
      nombre: 'Administrador MSC',
      rol: 'ADMIN'
    }
  });
  console.log('User seeded:', user);
}

seedUser().then(() => prisma.$disconnect());
