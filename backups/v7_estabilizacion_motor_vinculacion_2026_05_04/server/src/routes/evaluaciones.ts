import { Router } from 'express';
import prisma from '../db';

const router = Router();

// POST Guardar nueva evaluación (Wizard)
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        // Asignación de prueba o real del usuario
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
        const pointsMap: any = {
            dificultad: [0, 40, 80, 120, 160, 200],
            supervision: [0, 30, 60, 90, 120, 150],
            responsabilidad: [0, 40, 80, 120, 160, 200],
            condiciones: [0, 20, 40, 60, 80, 100],
            error: [0, 30, 60, 90, 120, 150],
            requisitos: [0, 40, 80, 120, 160, 200]
        };

        const evaluacion = await prisma.evaluacion.create({
            data: {
                puesto_id: data.puesto_id,
                periodo: new Date().getFullYear().toString(),
                evaluador_id: user.id,
                
                grado_dificultad: Number(data.dificultad),
                puntos_dificultad: pointsMap.dificultad[data.dificultad],
                justif_dificultad: data.difficulty_just || '',
                
                grado_supervision: Number(data.supervision),
                puntos_supervision: pointsMap.supervision[data.supervision],
                justif_supervision: data.supervision_just || '',
                
                grado_responsabilidad: Number(data.responsabilidad),
                puntos_responsabilidad: pointsMap.responsabilidad[data.responsabilidad],
                justif_responsabilidad: data.resp_just || '',
                
                grado_condiciones: Number(data.condiciones),
                puntos_condiciones: pointsMap.condiciones[data.condiciones],
                justif_condiciones: data.condiciones_just || '',
                
                grado_consecuencia_error: Number(data.error),
                puntos_consecuencia_error: pointsMap.error[data.error],
                justif_consecuencia_error: data.error_just || '',
                
                grado_requisitos: Number(data.requisitos),
                puntos_requisitos: pointsMap.requisitos[data.requisitos],
                justif_requisitos: data.requisitos_just || '',
                
                puntos_totales: data.puntos_totales,
                estado: 'aprobada' // Las marcamos como aprobadas para que fluyan al cálculo de VP de inmediato
            }
        });
        // Actualizar estado del puesto a Evaluado
        await prisma.puesto.update({
            where: { id: data.puesto_id },
            data: { estado: 'evaluado' }
        });
        res.status(201).json(evaluacion);
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener encuestas' });
    }
});

export default router;
