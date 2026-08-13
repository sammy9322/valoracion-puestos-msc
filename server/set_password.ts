/**
 * Define (o restablece) la contraseña de un usuario, guardándola hasheada.
 *
 *   npx ts-node set_password.ts admin@msc.go.cr "mi-clave-secreta"
 *
 * Es la única vía soportada para crear credenciales: el login rechaza cualquier
 * password que no esté hasheado con bcrypt.
 */
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import prisma from './src/db';

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Uso: npx ts-node set_password.ts <email> <password>');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('La contraseña debe tener al menos 12 caracteres.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hash },
    create: { email, password: hash, nombre: 'Administrador', rol: 'ADMIN' }
  });

  console.log(`✔ Contraseña actualizada para ${user.email} (rol: ${user.rol})`);
}

main()
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
