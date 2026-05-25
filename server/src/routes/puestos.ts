import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET all Puestos (excluir eliminados)
router.get('/', async (req, res) => {
    try {
        const puestos = await prisma.puesto.findMany({
            where: { eliminado: false },
            orderBy: { nombre: 'asc' }
        });
        res.json(puestos);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los puestos' });
    }
});

// GET Puestos Eliminados (solo Admin) — DEBE ir antes de /:id
router.get('/eliminados', async (req, res) => {
    try {
        const puestos = await prisma.puesto.findMany({
            where: { eliminado: true },
            orderBy: { fecha_eliminacion: 'desc' }
        });
        res.json(puestos);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los puestos eliminados' });
    }
});

// GET Puestos Clave only — DEBE ir antes de /:id
router.get('/clave', async (req, res) => {
    try {
        const clave = await prisma.puesto.findMany({
            where: { es_puesto_clave: true, eliminado: false },
            orderBy: { nombre: 'asc' }
        });
        res.json(clave);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener puestos clave' });
    }
});

// GET single Puesto (va al final para no atrapar /eliminados o /clave)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const puesto = await prisma.puesto.findUnique({
            where: { id }
        });
        if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });
        res.json(puesto);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el puesto' });
    }
});

// POST Create Puesto
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const nuevoPuesto = await prisma.puesto.create({
            data: {
                nombre: data.nombre,
                area: data.area,
                reporta_a: data.reporta_a,
                descripcion_funciones: data.descripcion_funciones,
                educacion_requerida: data.educacion_requerida,
                experiencia_requerida: data.experiencia_requerida,
                codigo_clase_msc: data.estrato, // Mapeo de estrato a codigo_clase_msc
                es_puesto_clave: data.es_puesto_clave || false,
                estado: 'borrador'
            }
        });
        res.status(201).json(nuevoPuesto);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la ficha de puesto' });
    }
});

// PUT Update Puesto
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const actualizado = await prisma.puesto.update({
            where: { id },
            data: {
                nombre: data.nombre,
                area: data.area,
                reporta_a: data.reporta_a,
                descripcion_funciones: data.descripcion_funciones,
                educacion_requerida: data.educacion_requerida,
                experiencia_requerida: data.experiencia_requerida,
                codigo_clase_msc: data.estrato, // Mapeo de estrato a codigo_clase_msc
                es_puesto_clave: data.es_puesto_clave !== undefined ? data.es_puesto_clave : undefined
            }
        });
        res.json(actualizado);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar la ficha de puesto' });
    }
});

// PUT Toggle Puesto Clave
router.put('/:id/clave', async (req, res) => {
    try {
        const { id } = req.params;
        const { es_puesto_clave } = req.body;
        const actualizado = await prisma.puesto.update({
            where: { id },
            data: { es_puesto_clave }
        });
        res.json(actualizado);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cambiar estatus de puesto clave' });
    }
});

// DELETE Puesto (Borrado Lógico)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const puesto = await prisma.puesto.findUnique({
            where: { id }
        });
        if (!puesto) {
            return res.status(404).json({ error: 'Ficha no encontrada' });
        }
        if (puesto.eliminado) {
            return res.status(400).json({ error: 'La ficha ya ha sido eliminada anteriormente' });
        }
        // Registrar en Auditoría
        let user = await prisma.user.findFirst();
        await prisma.auditoria.create({
            data: {
                tabla: 'Puesto',
                registro_id: id,
                accion: 'ELIMINACION',
                datos_antes: JSON.stringify(puesto),
                usuario_id: user?.id,
                timestamp: new Date()
            }
        });
        // Borrado lógico
        await prisma.puesto.update({
            where: { id },
            data: {
                eliminado: true,
                fecha_eliminacion: new Date(),
                estado: 'eliminado'
            }
        });
        res.json({ success: true, message: 'Ficha eliminada lógicamente (auditable)' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno al intentar eliminar la ficha' });
    }
});

export default router;
