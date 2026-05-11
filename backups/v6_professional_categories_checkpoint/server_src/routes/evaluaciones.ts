import { Router } from 'express';
import prisma from '../db';

const router = Router();

// POST Guardar nueva evaluación (Wizard)
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Asignación de prueba o real del usuario (normalmente sacado de req.user_id por JWT)
    // Buscamos un usuario de prueba o lo creamos
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          nombre: 'Evaluador Admin',
          email: 'admin@msc.go.cr',
          password: 'mock_password',
          rol: 'ADMIN'
        }
      });
    }

    const evaluacion = await prisma.evaluacion.create({
      data: {
        puesto_id: data.puesto_id,
        periodo: new Date().getFullYear().toString(),
        evaluador_id: user.id,

        grado_dificultad: data.dificultad.grado,
        puntos_dificultad: data.dificultad.puntos,
        justif_dificultad: data.dificultad.justificacion,

        grado_supervision: data.supervision.grado,
        puntos_supervision: data.supervision.puntos,
        justif_supervision: data.supervision.justificacion,

        grado_responsabilidad: data.responsabilidad.grado,
        puntos_responsabilidad: data.responsabilidad.puntos,
        justif_responsabilidad: data.responsabilidad.justificacion,

        grado_condiciones: data.condiciones.grado,
        puntos_condiciones: data.condiciones.puntos,
        justif_condiciones: data.condiciones.justificacion,

        grado_consecuencia_error: data.consecuencia_error.grado,
        puntos_consecuencia_error: data.consecuencia_error.puntos,
        justif_consecuencia_error: data.consecuencia_error.justificacion,

        grado_requisitos: data.requisitos.grado,
        puntos_requisitos: data.requisitos.puntos,
        justif_requisitos: data.requisitos.justificacion,

        puntos_totales: data.puntos_totales,
        estado: 'borrador' // En estado borrador hasta ser revisado
      }
    });

    // Actualizar estado del puesto a Evaluado
    await prisma.puesto.update({
      where: { id: data.puesto_id },
      data: { estado: 'evaluado' }
    });

    res.status(201).json(evaluacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar la Evaluación' });
  }
});

// GET Evaluaciones summary
router.get('/', async (req, res) => {
  try {
    const evaluaciones = await prisma.evaluacion.findMany({
      include: {
        puesto: {
          select: { nombre: true, area: true }
        }
      },
      orderBy: { fecha_evaluacion: 'desc' }
    });
    res.json(evaluaciones);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener encuestas' });
  }
});

export default router;
