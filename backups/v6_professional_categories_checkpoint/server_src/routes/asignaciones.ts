import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET Asignaciones List (Simulated Cross-Match)
router.get('/cruce', async (req, res) => {
  try {
    // 1. Conseguir el Último ValorPunto aprobado
    const ultimoVP = await prisma.valorPunto.findFirst({
      orderBy: { fecha_vigencia_inicio: 'desc' }
    });

    const vpUsar = ultimoVP ? parseFloat(ultimoVP.valor_punto_aplicado.toString()) : 1277.5; // Fallback para prueba

    // 2. Conseguir todas las evaluaciones más recientes
    const evaluaciones = await prisma.evaluacion.findMany({
      include: {
        puesto: true
      },
      orderBy: { fecha_evaluacion: 'desc' }
    });

    // Validar unicidad (solo el más reciente por puesto)
    const m = new Map();
    for (const eva of evaluaciones) {
      if (!m.has(eva.puesto_id)) {
        m.set(eva.puesto_id, eva);
      }
    }
    const unicas = Array.from(m.values());

    const minimoLegal = 352000; // Podría venir de la tabla SalarioMinimoLegal

    const cruce = unicas.map(eva => {
      const calculoBase = Math.round(eva.puntos_totales * vpUsar);
      const isUnderMin = calculoBase < minimoLegal;

      return {
        evaluacion_id: eva.id,
        puesto_id: eva.puesto_id,
        puesto_nombre: eva.puesto.nombre,
        puntos: eva.puntos_totales,
        calculo_base: calculoBase,
        isUnderMin,
        minimo_legal: minimoLegal
      }
    });

    res.json({ vp: vpUsar, cruce });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en CRUCE salarial' });
  }
});

// POST Publicar Escala Salarial (Asignaciones)
router.post('/publicar', async (req, res) => {
   try {
      const asignaciones = req.body.asignaciones; // Array de ajustes
      // ... Lógica para guardar en BD AsignacionSalario
      res.json({ ok: true });
   } catch(error) {
      res.status(500).json({ error: 'Falla publicando escala' });
   }
});

export default router;
