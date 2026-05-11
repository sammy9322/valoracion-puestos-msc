import { Router } from 'express';
import prisma from '../db';

const router = Router();

/**
 * GET /api/auditoria
 * Retorna registros de auditoría con filtros opcionales.
 * Query params: accion, fechaInicio, fechaFin
 */
router.get('/', async (req, res) => {
    try {
        const { accion, fechaInicio, fechaFin } = req.query;
        const where: any = {};
        if (accion) {
            where.accion = accion;
        }
        if (fechaInicio || fechaFin) {
            where.timestamp = {};
            if (fechaInicio) {
                where.timestamp.gte = new Date(fechaInicio as string);
            }
            if (fechaFin) {
                const endDate = new Date(fechaFin as string);
                endDate.setHours(23, 59, 59, 999);
                where.timestamp.lte = endDate;
            }
        }
        const logs = await prisma.auditoria.findMany({
            where,
            include: {
                usuario: {
                    select: {
                        nombre: true,
                        email: true,
                        rol: true
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 500
        });
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Error al obtener los registros de auditoría' });
    }
});

/**
 * GET /api/auditoria/estadisticas
 * Proporciona un resumen de actividad para el dashboard.
 */
router.get('/estadisticas', async (req, res) => {
    try {
        const totalAcciones = await prisma.auditoria.count();
        const eliminaciones = await prisma.auditoria.count({ where: { accion: 'ELIMINACION' } });
        const ultimas24h = await prisma.auditoria.count({
            where: {
                timestamp: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });
        res.json({
            total: totalAcciones,
            eliminaciones,
            recientes: ultimas24h
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas de auditoría' });
    }
});

export default router;
