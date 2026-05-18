import { Router } from 'express';
import prisma from '../db';

const router = Router();

/**
 * GET /vp/sugerido
 * Calcula el Valor del Punto sugerido basado en la Encuesta de Mercado de Puestos Clave.
 * Fórmula: Suma(Salarios Mercado) / Suma(Puntos Evaluación)
 */
router.get('/sugerido', async (req, res) => {
  try {
    const periodoActual = new Date().getFullYear().toString();

    // 1. Obtener Puestos Clave evaluados y con encuesta
    const puestosClave = await prisma.puesto.findMany({
      where: { 
        es_puesto_clave: true,
        eliminado: false
      },
      include: {
        evaluaciones: {
          where: { estado: 'aprobada' },
          orderBy: { fecha_evaluacion: 'desc' },
          take: 1
        },
        encuestas: {
          where: { periodo: periodoActual },
          orderBy: { fecha_encuesta: 'desc' },
          take: 1
        }
      }
    });

    // 2. Filtrar solo los que tienen AMBOS datos (Evaluación y Encuesta)
    const puestosValidos = puestosClave.filter(p => p.evaluaciones.length > 0 && p.encuestas.length > 0);

    if (puestosValidos.length === 0) {
      return res.json({ 
        success: false, 
        mensaje: 'No hay suficientes puestos clave con evaluación y encuesta aprobada para este periodo.',
        vpSugerido: 0 
      });
    }

    // 3. Calcular totales
    let sumaSalariosMercado = 0;
    let sumaPuntosEvaluacion = 0;

    const desglose = puestosValidos.map(p => {
      const salario = Number(p.encuestas[0].salario_promedio);
      const puntos = p.evaluaciones[0].puntos_totales;
      
      sumaSalariosMercado += salario;
      sumaPuntosEvaluacion += puntos;

      return {
        id: p.id,
        nombre: p.nombre,
        puntos: puntos,
        salario_mercado: salario,
        vp_individual: (salario / puntos).toFixed(4)
      };
    });

    const vpSugerido = sumaSalariosMercado / sumaPuntosEvaluacion;

    res.json({
      success: true,
      periodo: periodoActual,
      total_puestos_clave: puestosValidos.length,
      suma_salarios_mercado: sumaSalariosMercado,
      suma_puntos_evaluacion: sumaPuntosEvaluacion,
      vpSugerido: Number(vpSugerido.toFixed(4)),
      desglose
    });

  } catch (error) {
    console.error('Error calculando VP sugerido:', error);
    res.status(500).json({ error: 'Error interno en el cálculo técnico del VP.' });
  }
});

/**
 * POST /
 * Guarda el Valor del Punto definitivo para el periodo.
 */
router.post('/', async (req, res) => {
  try {
    const { periodo, valor_punto_aplicado, total_salarios, total_puntos, calculado_por, puestos_clave_usados } = req.body;

    const nuevoVP = await prisma.valorPunto.create({
      data: {
        periodo,
        valor_punto_aplicado,
        valor_punto_exacto: valor_punto_aplicado,
        total_salarios,
        total_puntos,
        puestos_clave_usados: puestos_clave_usados || 0,
        calculado_por,
        fecha_vigencia_inicio: new Date(),
      },
    });

    res.status(201).json(nuevoVP);
  } catch (error) {
    console.error('Error guardando VP:', error);
    res.status(500).json({ error: 'Error al guardar el Valor del Punto.' });
  }
});

/**
 * GET /actual o /vp (Alias para compatibilidad)
 * Obtiene el Valor del Punto vigente.
 */
router.get(['/actual', '/vp'], async (req, res) => {
  try {
    const vp = await prisma.valorPunto.findFirst({
      orderBy: { fecha_vigencia_inicio: 'desc' }
    });
    res.json(vp);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener VP actual.' });
  }
});

export default router;
