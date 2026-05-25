import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/db';

async function main() {
  const puestos = await prisma.puesto.findMany({
    take: 5
  });
  console.log('Puestos:', JSON.stringify(puestos, null, 2));
}

main().catch(console.error);
