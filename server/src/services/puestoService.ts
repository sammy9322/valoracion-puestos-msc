import prisma from '../db';

export async function findPuestoWithEstrato(id: string) {
  const puesto = await prisma.puesto.findUnique({ where: { id } });
  if (!puesto) return null;

  let estrato: string | null = null;
  if (puesto.codigo_clase_msc) {
    const catalogo = await prisma.catalogoPuesto.findFirst({
      where: { clase: puesto.codigo_clase_msc, es_vigente: true },
      select: { estrato: true }
    });
    if (catalogo) estrato = catalogo.estrato;
  }

  return { ...puesto, estrato };
}
