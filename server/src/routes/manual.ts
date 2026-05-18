import { Router, Request, Response } from 'express';
import multer from 'multer';
import prisma from '../db';
import { parseManual } from '../services/manualParser';
import { manualService } from '../services/manualService';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowed = ['.pdf', '.docx'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.')).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF o DOCX'));
    }
  }
});

router.post('/upload', upload.single('archivo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const buffer = req.file.buffer;
    const filename = req.file.originalname;

    // No guardar copia en disco local para evitar errores EROFS en serverless
    console.log(`=== Procesando: ${filename} (${buffer.length} bytes) ===`);

    let resultado;
    try {
      resultado = await parseManual(buffer, filename);
    } catch (parseError: any) {
      console.error('Error específico en parseManual:', parseError);
      throw new Error(`Fallo en el motor de parseo: ${parseError.message}`);
    }
    
    // Guardar directamente en la base de datos para evitar pérdida de datos en memoria (Serverless/Nodemon)
    let countVinculados = 0;
    try {
      if (resultado.resumen.total_cargos > 0) {
        // 1. Guardar en el nuevo motor enriquecido (para FichasPuestos)
        const saveResult = await manualService.guardarCatalogoEnriquecido(resultado);
        countVinculados = saveResult.count;

        // 2. Mantener compatibilidad con la tabla CatalogoPuesto (para el resto del sistema)
        await prisma.$transaction(async (tx) => {
          await tx.catalogoPuesto.updateMany({
            where: { es_vigente: true },
            data: { es_vigente: false }
          });

          const nuevaVersion = Date.now();

          for (const clase of resultado.clases) {
            for (const cargo of clase.cargos) {
              await tx.catalogoPuesto.create({
                data: {
                  nombre: cargo.nombre,
                  clase: clase.nombre_clase,
                  estrato: clase.estrato,
                  naturaleza: clase.naturaleza,
                  cargo_contenido: cargo.nombre,
                  funciones: JSON.stringify(cargo.funciones),
                  requisitos_academicos: cargo.requisitos.academicos,
                  requisitos_experiencia: cargo.requisitos.experiencia,
                  requisitos_supervision: cargo.requisitos.supervision,
                  requisitos_legales: cargo.requisitos.legales,
                  conocimientos_deseables: JSON.stringify(cargo.conocimientos),
                  condiciones_personales: JSON.stringify(cargo.condiciones),
                  version: nuevaVersion,
                  fecha_importacion: new Date(),
                  es_vigente: true
                }
              });
            }
          }
        });
      }
    } catch (dbError: any) {
      console.error('Error al guardar en base de datos:', dbError);
      throw new Error(`Error de persistencia: ${dbError.message}`);
    }

    console.log(`Parseo y guardado exitoso: ${resultado.resumen.total_clases} clases, ${resultado.resumen.total_cargos} cargos extraídos. Vinculados: ${countVinculados}`);

    res.json({
      success: true,
      saved: resultado.resumen.total_cargos > 0,
      message: resultado.resumen.total_cargos > 0
        ? `Importados y guardados ${resultado.resumen.total_cargos} cargos correctamente en la base de datos.`
        : 'No se detectaron cargos en el archivo. Revise los logs del servidor.',
      preview: {
        resumen: resultado.resumen,
        clases_preview: resultado.clases.slice(0, 10).map(c => ({
          nombre: c.nombre_clase,
          estrato: c.estrato,
          cargos_count: c.cargos.length,
          cargos: c.cargos.map(ca => ({
            nombre: ca.nombre,
            vinculado: ca.vinculado,
            nombre_oficial: ca.nombre_oficial
          }))
        }))
      },
      version: resultado.version
    });
  } catch (error: any) {
    console.error('ERROR CRÍTICO EN UPLOAD:', error);
    res.status(500).json({ error: error?.message || 'Error desconocido en el servidor' });
  }
});

router.post('/confirmar', async (req: Request, res: Response) => {
  try {
    // El guardado ahora se hace en /upload para evitar problemas de memoria.
    // Esta ruta se mantiene por compatibilidad con el frontend.
    res.json({
      success: true,
      message: 'Catálogo enriquecido guardado y confirmado exitosamente.',
      version: Date.now()
    });
  } catch (error) {
    console.error('Error al confirmar importación:', error);
    res.status(500).json({ error: 'Error al confirmar el catálogo' });
  }
});

router.get('/vigente', async (req: Request, res: Response) => {
  try {
    const catalogo = await manualService.getManualActivo();
    
    // Obtener info de versión del primer registro
    const first = catalogo[0];
    
    res.json({
      catalogo: catalogo,
      version: first?.version_label || '1.0',
      fecha_importacion: first?.fecha_vinculacion || null
    });
  } catch (error) {
    console.error('Error al obtener catálogo vigente:', error);
    res.status(500).json({ error: 'Error al obtener el catálogo' });
  }
});

router.get('/historial', async (req: Request, res: Response) => {
  try {
    const versiones = await prisma.catalogoPuesto.groupBy({
      by: ['version'],
      _max: { fecha_importacion: true },
      orderBy: { version: 'desc' }
    });

    res.json(versiones.map(v => ({
      version: v.version,
      fecha_importacion: v._max.fecha_importacion
    })));
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener el historial' });
  }
});

router.get('/versiones/:version', async (req: Request, res: Response) => {
  try {
    const { version } = req.params;
    const puestos = await prisma.catalogoPuesto.findMany({
      where: { version: parseInt(version) },
      orderBy: { nombre: 'asc' }
    });

    res.json(puestos);
  } catch (error) {
    console.error('Error al obtener versión:', error);
    res.status(500).json({ error: 'Error al obtener la versión' });
  }
});

export default router;