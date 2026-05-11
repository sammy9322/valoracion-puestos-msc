import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET Calcular Valor Punto (Live)
router.get('/vp', async (req, res) => {
  try {
    // 1. Obtener Puestos Clave que tengan Evaluación aprobada/cerrada (o evaluados) y Encuesta 
    const puestosClave = await prisma.puesto.findMany({
      where: { 
        es_puesto_clave: true,
        estado: 'evaluado'
      },
      include: {
        evaluaciones: { orderBy: { fecha_evaluacion: 'desc' }, take: 1 },
        encuestas: { orderBy: { fecha_encuesta: 'desc' }, take: 1 }
      }
    });

    let totalSalarios = 0;
    let totalPuntos = 0;
    const itemsProcesados = [];

    for (const puesto of puestosClave) {
      if (puesto.evaluaciones.length > 0 && puesto.encuestas.length > 0) {
        const puntos = puesto.evaluaciones[0].puntos_totales;
        const salarioStr = puesto.encuestas[0].salario_promedio.toString();
        const salario = parseFloat(salarioStr);
        
        totalSalarios += salario;
        totalPuntos += puntos;

        itemsProcesados.push({
          puesto: puesto.nombre,
          puntos,
          salario
        });
      }
    }

    if (totalPuntos === 0) {
      // Retorno vacío amigable si falta información
      return res.json({ vpExact: null, totalSalarios: 0, totalPuntos: 0, items: [] });
    }

    const vpExact = totalSalarios / totalPuntos;
    const vpRedondeado = Math.round(vpExact / 50) * 50;

    res.json({
      totalSalarios,
      totalPuntos,
      vpExact,
      vpRedondeado,
      items: itemsProcesados
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error calculando Valor de Punto' });
  }
});

// POST Guardar Valor Punto Aprobado
router.post('/vp', async (req, res) => {
  try {
    const { vp_aplicado, total_salarios, total_puntos, vp_exacto, cantidad_puestos } = req.body;
    
    // Usuario por defecto por ahora
    const mockUser = await prisma.user.findFirst();

    const nuevoVP = await prisma.valorPunto.create({
      data: {
        periodo: "2024",
        total_salarios,
        total_puntos,
        valor_punto_exacto: vp_exacto,
        valor_punto_aplicado: vp_aplicado,
        puestos_clave_usados: cantidad_puestos,
        calculado_por: mockUser!.id,
        fecha_vigencia_inicio: new Date()
      }
    });

    res.status(201).json(nuevoVP);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error guardando VP' });
  }
});

export default router;
