import { Router } from 'express';
import { runValuationPipeline } from '../services/valuationPipeline';
import { FACTOR_CONFIG, POINTS_MAP } from '../config/factorTables';
import { generateEvaluationReport } from '../services/reportGenerator';
import { enrich as enrichProc } from '../services/procedimientosService';
import { parseEntrevistaMD } from '../services/interviewParser';
import prisma from '../db';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.post('/pipeline', upload.single('plaudTranscript'), async (req, res) => {
  try {
    const { puesto_id } = req.body;
    if (!puesto_id) return res.status(400).json({ error: 'puesto_id es requerido' });

    const puesto = await prisma.puesto.findUnique({ where: { id: puesto_id } });
    if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });

    let interviewCtx = undefined;
    if (req.file) {
      console.log(`[Valoracion] Archivo PLAUD recibido: ${req.file.originalname} (${req.file.size} bytes)`);
      interviewCtx = await parseEntrevistaMD(req.file.buffer, { filename: req.file.originalname });
    }

    const report = await runValuationPipeline(puesto, interviewCtx);

    res.json({
      success: true,
      report: report,
      analisis_multifuente: report.analisis_multifuente,
      alerta_global: report.alerta_global
    });
  } catch (error: any) {
    console.error('[Pipeline Error]:', error);
    res.status(500).json({ error: 'Error en el pipeline de auditoría', detail: error.message });
  }
});

router.post('/pipeline/save', async (req, res) => {
  try {
    const { report } = req.body;
    if (!report || !report.puesto_id) {
      return res.status(400).json({ error: 'Reporte de auditoría incompleto' });
    }

    const puesto = await prisma.puesto.findUnique({ where: { id: report.puesto_id } });
    if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });

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

    const ev = report.evaluacion;
    const fp = (k: string) => {
      const grade = ev[k];
      return POINTS_MAP[k]?.[grade] ?? 0;
    };

    const evaluacion = await prisma.evaluacion.create({
      data: {
        puesto_id: report.puesto_id,
        periodo: new Date().getFullYear().toString(),
        evaluador_id: user.id,

        grado_dificultad: Number(ev.dificultad),
        puntos_dificultad: fp('dificultad'),
        justif_dificultad: ev.dificultad_just || '',

        grado_supervision: Number(ev.supervision),
        puntos_supervision: fp('supervision'),
        justif_supervision: ev.supervision_just || '',

        grado_responsabilidad: Number(ev.responsabilidad),
        puntos_responsabilidad: fp('responsabilidad'),
        justif_responsabilidad: ev.responsabilidad_just || '',

        grado_condiciones: Number(ev.condiciones),
        puntos_condiciones: fp('condiciones'),
        justif_condiciones: ev.condiciones_just || '',

        grado_consecuencia_error: Number(ev.error),
        puntos_consecuencia_error: fp('error'),
        justif_consecuencia_error: ev.error_just || '',

        grado_requisitos: Number(ev.requisitos),
        puntos_requisitos: fp('requisitos'),
        justif_requisitos: ev.requisitos_just || '',

        puntos_totales: report.totalPuntos,
        estado: 'aprobada'
      }
    });

    try {
      await prisma.evaluacion.update({
        where: { id: evaluacion.id },
        data: {
          motor: report.auditoria.motor || 'llm',
          buildVersion: report.auditoria.buildVersion || '',
          auditoria: report,
        } as any
      });
    } catch (_e) {
      console.warn('[Valoracion] Could not save audit metadata:', _e);
    }

    await prisma.auditoria.create({
      data: {
        tabla: 'Evaluacion',
        registro_id: evaluacion.id,
        accion: 'AUDITORIA_COMPLETA',
        datos_antes: JSON.stringify({ puesto_id: report.puesto_id }),
        datos_despues: JSON.stringify({ evaluacion_id: evaluacion.id, reporte: report }),
        usuario_id: user.id,
        timestamp: new Date()
      }
    });

    await prisma.puesto.update({
      where: { id: report.puesto_id },
      data: { estado: 'evaluado' }
    });

    res.json({ success: true, evaluacion_id: evaluacion.id });

  } catch (error: any) {
    console.error('[Pipeline Save Error]:', error);
    res.status(500).json({ error: 'Error al guardar el reporte de auditoría', detail: error.message });
  }
});

router.post('/pipeline/report', async (req, res) => {
  try {
    const { report } = req.body;
    if (!report || !report.puesto_id || !report.evaluacion) {
      return res.status(400).json({ error: 'Datos de reporte incompletos' });
    }

    const ev = report.evaluacion;
    const puesto = await prisma.puesto.findUnique({ where: { id: report.puesto_id } });
    if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });

    const procCtx = await enrichProc(puesto).catch(() => undefined);

    const fp = (k: string) => {
      const grade = Number(ev[k]);
      return POINTS_MAP[k]?.[grade] ?? 0;
    };

    const evaluacionPdf = {
      puesto,
      analisis_multifuente: report.analisis_multifuente,
      alerta_global: report.alerta_global,
      grado_dificultad: Number(ev.dificultad),
      puntos_dificultad: fp('dificultad'),
      justif_dificultad: ev.dificultad_just || '',
      grado_supervision: Number(ev.supervision),
      puntos_supervision: fp('supervision'),
      justif_supervision: ev.supervision_just || '',
      grado_responsabilidad: Number(ev.responsabilidad),
      puntos_responsabilidad: fp('responsabilidad'),
      justif_responsabilidad: ev.responsabilidad_just || '',
      grado_condiciones: Number(ev.condiciones),
      puntos_condiciones: fp('condiciones'),
      justif_condiciones: ev.condiciones_just || '',
      grado_consecuencia_error: Number(ev.error),
      puntos_consecuencia_error: fp('error'),
      justif_consecuencia_error: ev.error_just || '',
      grado_requisitos: Number(ev.requisitos),
      puntos_requisitos: fp('requisitos'),
      justif_requisitos: ev.requisitos_just || '',
      puntos_totales: report.totalPuntos,
      motor: report.auditoria?.motor || 'llm',
      buildVersion: report.auditoria?.buildVersion || '',
      fecha_evaluacion: new Date()
    };

    const doc = generateEvaluationReport(evaluacionPdf, procCtx ?? undefined);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="informe-evaluacion-${puesto.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (error: any) {
    console.error('[Pipeline Report Error]:', error);
    res.status(500).json({ error: 'Error al generar el PDF', detail: error.message });
  }
});

export default router;
