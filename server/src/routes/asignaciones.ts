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
            };
        });
        res.json({ vp: vpUsar, cruce });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en CRUCE salarial' });
    }
});

// GET all Asignaciones
router.get('/', async (req, res) => {
    try {
        const data = await prisma.asignacionSalario.findMany({
            include: {
                puesto: true,
                evaluacion: true
            },
            orderBy: { fecha_asignacion: 'desc' }
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener asignaciones' });
    }
});

// PATCH Armonizar (Ajuste Manual con Auditoría)
router.patch('/:id/armonizar', async (req, res) => {
    try {
        const { id } = req.params;
        const { salario_ajustado, justif_ajuste, usuario_id } = req.body;

        const original = await prisma.asignacionSalario.findUnique({
            where: { id }
        });

        if (!original) return res.status(404).json({ error: 'Asignación no encontrada' });

        // 1. Actualizar la asignación
        const actualizado = await prisma.asignacionSalario.update({
            where: { id },
            data: {
                salario_ajustado: parseFloat(salario_ajustado),
                justif_ajuste,
                fecha_asignacion: new Date() // Actualizar fecha de modificación
            }
        });

        // 2. Registro en Auditoría (Requerimiento SEVRI R21)
        await prisma.auditoria.create({
            data: {
                tabla: 'AsignacionSalario',
                registro_id: id,
                accion: 'ARMONIZACION_MANUAL',
                datos_antes: original as any,
                datos_despues: actualizado as any,
                usuario_id: usuario_id || null,
                timestamp: new Date()
            }
        });

        res.json({ success: true, data: actualizado });
    } catch (error) {
        console.error('Error en armonización:', error);
        res.status(500).json({ error: 'Error al procesar el ajuste manual' });
    }
});

// POST Publicar Escala Salarial (Asignaciones)
router.post('/publicar', async (req, res) => {
    try {
        const { cruce, vp, periodo } = req.body;

        if (!cruce || !Array.isArray(cruce)) {
            return res.status(400).json({ error: 'Datos de cruce inválidos' });
        }

        // 1. Obtener o crear el registro de ValorPunto para este periodo
        const vpRecord = await prisma.valorPunto.findFirst({
            where: { periodo },
            orderBy: { fecha_vigencia_inicio: 'desc' }
        });

        if (!vpRecord) {
            return res.status(400).json({ error: 'No existe un Valor de Punto aprobado para este periodo' });
        }

        // 2. Guardar cada asignación en una transacción
        const results = await prisma.$transaction(
            cruce.map((item: any) => 
                prisma.asignacionSalario.create({
                    data: {
                        puesto_id: item.puesto_id,
                        evaluacion_id: item.evaluacion_id,
                        valor_punto_id: vpRecord.id,
                        puntos_totales: item.puntos,
                        salario_calculado: item.calculo_base,
                        salario_minimo_legal: item.minimo_legal,
                        cumple_minimo_legal: !item.isUnderMin,
                        coherencia_jerarquica: true, // Se validará en P8
                        periodo: periodo || '2024'
                    }
                })
            )
        );

        res.json({ success: true, count: results.length });
    } catch (error) {
        console.error('Error al publicar escala:', error);
        res.status(500).json({ error: 'Falla publicando escala' });
    }
});

export default router;
