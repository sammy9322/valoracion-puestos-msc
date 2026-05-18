import { Router } from 'express';
import prisma from '../db';
import { aiAgentService, POINTS_MAP } from '../services/aiAgentService';
import { generateEvaluationReport } from '../services/reportGenerator';
import { enrich as enrichProc } from '../services/procedimientosService';

const router = Router();

// POST Guardar nueva evaluación (Wizard — legacy)
router.post('/', async (req, res) => {
    try {
        const data = req.body;
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

        const calculatedPoints =
            POINTS_MAP.dificultad[Number(data.dificultad)] +
            POINTS_MAP.supervision[Number(data.supervision)] +
            POINTS_MAP.responsabilidad[Number(data.responsabilidad)] +
            POINTS_MAP.condiciones[Number(data.condiciones)] +
            POINTS_MAP.error[Number(data.error)] +
            POINTS_MAP.requisitos[Number(data.requisitos)];

        const evaluacion = await prisma.evaluacion.create({
            data: {
                puesto_id: data.puesto_id,
                periodo: new Date().getFullYear().toString(),
                evaluador_id: user.id,

                grado_dificultad: Number(data.dificultad),
                puntos_dificultad: POINTS_MAP.dificultad[data.dificultad],
                justif_dificultad: data.difficulty_just || '',

                grado_supervision: Number(data.supervision),
                puntos_supervision: POINTS_MAP.supervision[data.supervision],
                justif_supervision: data.supervision_just || '',

                grado_responsabilidad: Number(data.responsabilidad),
                puntos_responsabilidad: POINTS_MAP.responsabilidad[data.responsabilidad],
                justif_responsabilidad: data.resp_just || '',

                grado_condiciones: Number(data.condiciones),
                puntos_condiciones: POINTS_MAP.condiciones[data.condiciones],
                justif_condiciones: data.condiciones_just || '',

                grado_consecuencia_error: Number(data.error),
                puntos_consecuencia_error: POINTS_MAP.error[data.error],
                justif_consecuencia_error: data.error_just || '',

                grado_requisitos: Number(data.requisitos),
                puntos_requisitos: POINTS_MAP.requisitos[data.requisitos],
                justif_requisitos: data.requisitos_just || '',

                puntos_totales: calculatedPoints,
                estado: 'aprobada'
            }
        });

        await prisma.auditoria.create({
            data: {
                tabla: 'Evaluacion',
                registro_id: evaluacion.id,
                accion: 'CREACION',
                datos_despues: JSON.stringify(evaluacion),
                usuario_id: user.id,
                timestamp: new Date()
            }
        });

        await prisma.puesto.update({
            where: { id: data.puesto_id },
            data: { estado: 'evaluado' }
        });
        res.status(201).json(evaluacion);
    }
    catch (error) {
        console.error('Error al registrar evaluación:', error);
        res.status(500).json({ error: 'Error al registrar la Evaluación' });
    }
});

// POST Evaluación automática con IA (nuevo flujo objetivo)
router.post('/ai-evaluate', async (req, res) => {
    try {
        const { puesto_id } = req.body;
        if (!puesto_id) {
            return res.status(400).json({ error: 'puesto_id es requerido' });
        }

        const puesto = await prisma.puesto.findUnique({
            where: { id: puesto_id }
        });
        if (!puesto) {
            return res.status(404).json({ error: 'Puesto no encontrado' });
        }

        const result = await aiAgentService.evaluate(puesto);

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
                puesto_id: puesto.id,
                periodo: new Date().getFullYear().toString(),
                evaluador_id: user.id,

                grado_dificultad: Number(result.data.dificultad),
                puntos_dificultad: POINTS_MAP.dificultad[result.data.dificultad],
                justif_dificultad: result.data.dificultad_just || '',

                grado_supervision: Number(result.data.supervision),
                puntos_supervision: POINTS_MAP.supervision[result.data.supervision],
                justif_supervision: result.data.supervision_just || '',

                grado_responsabilidad: Number(result.data.responsabilidad),
                puntos_responsabilidad: POINTS_MAP.responsabilidad[result.data.responsabilidad],
                justif_responsabilidad: result.data.responsabilidad_just || '',

                grado_condiciones: Number(result.data.condiciones),
                puntos_condiciones: POINTS_MAP.condiciones[result.data.condiciones],
                justif_condiciones: result.data.condiciones_just || '',

                grado_consecuencia_error: Number(result.data.error),
                puntos_consecuencia_error: POINTS_MAP.error[result.data.error],
                justif_consecuencia_error: result.data.error_just || '',

                grado_requisitos: Number(result.data.requisitos),
                puntos_requisitos: POINTS_MAP.requisitos[result.data.requisitos],
                justif_requisitos: result.data.requisitos_just || '',

                puntos_totales: result.totalPuntos,
                estado: 'borrador'
            }
        });

        await prisma.auditoria.create({
            data: {
                tabla: 'Evaluacion',
                registro_id: evaluacion.id,
                accion: 'EVALUACION_IA',
                datos_antes: JSON.stringify({ puesto_id: puesto.id, nombre: puesto.nombre }),
                datos_despues: JSON.stringify({ evaluacion_id: evaluacion.id, total_puntos: result.totalPuntos, analisis: result.data }),
                usuario_id: user.id,
                timestamp: new Date()
            }
        });

        await prisma.puesto.update({
            where: { id: puesto_id },
            data: { estado: 'evaluado' }
        });

        res.status(201).json({
            success: true,
            evaluacion,
            totalPuntos: result.totalPuntos,
            analisis: result.data,
            procedimientosCount: result.procedimientosCount || 0,
            factorKeywords: result.factorKeywords || [],
            build_version: '28aa2ac-fix-pdf-llm-proc'
        });

    } catch (error: any) {
        console.error('Error en /ai-evaluate:', error);
        res.status(500).json({ error: error.message || 'Error al realizar evaluación automática' });
    }
});

// PUT Actualizar evaluación (ajustes manuales post-IA)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const existing = await prisma.evaluacion.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Evaluación no encontrada' });
        }

        const calculatedPoints =
            POINTS_MAP.dificultad[Number(data.dificultad)] +
            POINTS_MAP.supervision[Number(data.supervision)] +
            POINTS_MAP.responsabilidad[Number(data.responsabilidad)] +
            POINTS_MAP.condiciones[Number(data.condiciones)] +
            POINTS_MAP.error[Number(data.error)] +
            POINTS_MAP.requisitos[Number(data.requisitos)];

        const evaluacion = await prisma.evaluacion.update({
            where: { id },
            data: {
                grado_dificultad: Number(data.dificultad),
                puntos_dificultad: POINTS_MAP.dificultad[data.dificultad],
                justif_dificultad: data.difficulty_just || existing.justif_dificultad,
                grado_supervision: Number(data.supervision),
                puntos_supervision: POINTS_MAP.supervision[data.supervision],
                justif_supervision: data.supervision_just || existing.justif_supervision,
                grado_responsabilidad: Number(data.responsabilidad),
                puntos_responsabilidad: POINTS_MAP.responsabilidad[data.responsabilidad],
                justif_responsabilidad: data.resp_just || existing.justif_responsabilidad,
                grado_condiciones: Number(data.condiciones),
                puntos_condiciones: POINTS_MAP.condiciones[data.condiciones],
                justif_condiciones: data.condiciones_just || existing.justif_condiciones,
                grado_consecuencia_error: Number(data.error),
                puntos_consecuencia_error: POINTS_MAP.error[data.error],
                justif_consecuencia_error: data.error_just || existing.justif_consecuencia_error,
                grado_requisitos: Number(data.requisitos),
                puntos_requisitos: POINTS_MAP.requisitos[data.requisitos],
                justif_requisitos: data.requisitos_just || existing.justif_requisitos,
                puntos_totales: calculatedPoints,
                estado: data.estado || existing.estado
            }
        });

        res.json(evaluacion);
    } catch (error: any) {
        console.error('Error actualizando evaluación:', error);
        res.status(500).json({ error: 'Error al actualizar la evaluación' });
    }
});

// GET Reporte PDF de una evaluación
router.get('/:id/report', async (req, res) => {
    try {
        const { id } = req.params;

        const evaluacion = await prisma.evaluacion.findUnique({
            where: { id },
            include: { puesto: true }
        });

        if (!evaluacion) {
            return res.status(404).json({ error: 'Evaluación no encontrada' });
        }

        const procCtx = await enrichProc(evaluacion.puesto).catch(() => undefined);
        const doc = generateEvaluationReport(evaluacion, procCtx ?? undefined);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="informe-evaluacion-${evaluacion.puesto.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf"`);

        doc.pipe(res);
        doc.end();

    } catch (error: any) {
        console.error('Error generando PDF:', error);
        res.status(500).json({ error: 'Error al generar el informe PDF' });
    }
});

// POST Sugerencia de evaluación con IA (legacy)
router.post('/suggest', async (req, res) => {
    try {
        const puesto = req.body;
        const suggestion = await aiAgentService.suggestEvaluation(puesto);
        if (!suggestion) {
            return res.status(500).json({ error: 'El agente IA no pudo procesar la solicitud' });
        }
        res.json(suggestion);
    } catch (error: any) {
        console.error('Error en ruta /suggest:', error);
        res.status(500).json({ error: error.message || 'Error interno en sugerencia IA' });
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
