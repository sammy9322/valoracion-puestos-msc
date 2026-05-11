import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET all Puestos
router.get('/', async (req, res) => {
  try {
    const puestos = await prisma.puesto.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json(puestos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los puestos' });
  }
});

// GET Puestos Clave only
router.get('/clave', async (req, res) => {
  try {
    const clave = await prisma.puesto.findMany({
      where: { es_puesto_clave: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(clave);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener puestos clave' });
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
        es_puesto_clave: data.es_puesto_clave || false,
        estado: 'borrador'
      }
    });
    res.status(201).json(nuevoPuesto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la ficha de puesto' });
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar estatus de puesto clave' });
  }
});

export default router;
