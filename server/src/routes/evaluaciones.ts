import { Router } from 'express';
import prisma from '../db';
import { aiAgentService, POINTS_MAP, BUILD_VERSION } from '../services/aiAgentService';
import { generateEvaluationReport } from '../services/reportGenerator';
import { generateHtmlReport } from '../services/htmlReportGenerator';
import { enrich as enrichProc } from '../services/procedimientosService';
import { parseEntrevistaMD } from '../services/interviewParser';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

async function saveEvaluacion(data: any) {
  try {
    return await prisma.evaluacion.create({ data });
  } catch (e: any) {
    console.warn('[Evaluacion] create failed, trying with raw SQL:', e.message);
    const safeKeys = Object.keys(data).filter(k =>
      !['analisis_multifuente', 'alerta_global', 'motor', 'buildVersion'].includes(k)
    );
    const values = safeKeys.map(k => data[k]);
    const placeholders = safeKeys.map((_, i) => `$${i + 1}`).join(', ');
    const cols = safeKeys.map(c => `"${c}"`).join(', ');
    const rows: any = await prisma.$queryRawUnsafe(
      `INSERT INTO "Evaluacion" (${cols}) VALUES (${placeholders}) RETURNING *`,
      ...values
    );
    return rows?.[0] as any;
  }
}

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
                justif_responsabilidad: data.responsabilidad_just || '',

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
                estado: 'borrador'
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

// POST Evaluación automática con IA (nuevo flujo objetivo + multifuente)
router.post('/ai-evaluate', upload.single('plaudTranscript'), async (req, res) => {
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

        // Si se subió un archivo de transcripción PLAUD, pre-procesarlo
        let interviewCtx = undefined;
        if (req.file) {
            console.log(`[Routes] Archivo PLAUD recibido: ${req.file.originalname} (${req.file.size} bytes)`);
            interviewCtx = await parseEntrevistaMD(req.file.buffer, { filename: req.file.originalname });
            console.log(`[Routes] Entrevista pre-procesada: ${interviewCtx.entrevistado || 'sin nombre'} — ${interviewCtx.factores.filter(() => true).length} factores con citas`);
        }

        const result = await aiAgentService.evaluate(puesto, interviewCtx);

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

        const fp = (k: string) => result.factorPoints?.[k] ?? (POINTS_MAP as any)[k][(result.data as any)[k]];

        const evaluacion = await saveEvaluacion({
            puesto_id: puesto.id,
            periodo: new Date().getFullYear().toString(),
            evaluador_id: user.id,

            grado_dificultad: Number(result.data.dificultad),
            puntos_dificultad: fp('dificultad'),
            justif_dificultad: result.data.dificultad_just || '',

            grado_supervision: Number(result.data.supervision),
            puntos_supervision: fp('supervision'),
            justif_supervision: result.data.supervision_just || '',

            grado_responsabilidad: Number(result.data.responsabilidad),
            puntos_responsabilidad: fp('responsabilidad'),
            justif_responsabilidad: result.data.responsabilidad_just || '',

            grado_condiciones: Number(result.data.condiciones),
            puntos_condiciones: fp('condiciones'),
            justif_condiciones: result.data.condiciones_just || '',

            grado_consecuencia_error: Number(result.data.error),
            puntos_consecuencia_error: fp('error'),
            justif_consecuencia_error: result.data.error_just || '',

            grado_requisitos: Number(result.data.requisitos),
            puntos_requisitos: fp('requisitos'),
            justif_requisitos: result.data.requisitos_just || '',

            puntos_totales: result.totalPuntos,
            estado: 'borrador'
        });

        // Store motor/buildVersion via typed Prisma API
        try {
            await prisma.evaluacion.update({
                where: { id: evaluacion.id },
                data: {
                    motor: result.motor || 'rule-based',
                    buildVersion: result.buildVersion || BUILD_VERSION,
                } as any
            });
        } catch (_e) {
            console.warn('[Evaluacion] Could not save motor/buildVersion, columns may not exist yet:', _e);
        }

        await prisma.auditoria.create({
            data: {
                tabla: 'Evaluacion',
                registro_id: evaluacion.id,
                accion: 'EVALUACION_IA',
                datos_antes: JSON.stringify({ puesto_id: puesto.id, nombre: puesto.nombre }),
                datos_despues: JSON.stringify({
                    evaluacion_id: evaluacion.id,
                    total_puntos: result.totalPuntos,
                    analisis: result.data,
                    analisis_multifuente: result.analisis_multifuente,
                    alerta_global: result.alerta_global
                }),
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
            buildVersion: result.buildVersion || BUILD_VERSION,
            factorPoints: result.factorPoints || {},
            procContribution: result.procContribution || [],
            motor: result.motor,
            interviewContext: interviewCtx,
            analisis_multifuente: result.analisis_multifuente,
            alerta_global: result.alerta_global,
            debug: {
                procedimientosEncontrados: result.procedimientosCount || 0,
                entrevistaProcesada: !!interviewCtx,
                contradiccionesDetectadas: result.analisis_multifuente?.filter(e => e.contradiccion).length || 0,
                grados: {
                    dificultad: result.data.dificultad,
                    supervision: result.data.supervision,
                    responsabilidad: result.data.responsabilidad,
                    condiciones: result.data.condiciones,
                    error: result.data.error,
                    requisitos: result.data.requisitos,
                }
            }
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

// GET Reporte PDF/HTML de una evaluación
router.get('/:id/report', async (req, res) => {
    try {
        const { id } = req.params;
        const format = req.query.format;

        const evaluacion = await prisma.evaluacion.findUnique({
            where: { id },
            include: { puesto: true }
        });

        if (!evaluacion) {
            return res.status(404).json({ error: 'Evaluación no encontrada' });
        }

        // Read motor/buildVersion via raw SQL (columns may not exist in model)
        let motor: string | undefined;
        let buildVersion: string | undefined;
        try {
            const row: any = await prisma.$queryRawUnsafe(
                `SELECT "motor", "buildVersion" FROM "Evaluacion" WHERE "id" = $1`,
                id
            );
            if (row?.length) {
                motor = row[0].motor;
                buildVersion = row[0].buildVersion;
            }
        } catch (_e) {
            console.warn('[Evaluacion] Could not read motor/buildVersion, columns may not exist yet');
        }
        (evaluacion as any).motor = motor;
        (evaluacion as any).buildVersion = buildVersion;

        const procCtx = await enrichProc(evaluacion.puesto).catch(() => undefined);

        const puestoNombre = evaluacion.puesto.nombre.replace(/\s+/g, '-').toLowerCase();

        if (format === 'pdf') {
            const doc = generateEvaluationReport(evaluacion, procCtx ?? undefined);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="informe-evaluacion-${puestoNombre}.pdf"`);
            doc.pipe(res);
            doc.end();
        } else {
            const html = generateHtmlReport(evaluacion, procCtx ?? undefined);
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Disposition', `attachment; filename="informe-evaluacion-${puestoNombre}.html"`);
            res.send(html);
        }

    } catch (error: any) {
        console.error('Error generando informe:', error);
        res.status(500).json({ error: 'Error al generar el informe', detail: error?.message || error?.toString() });
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
