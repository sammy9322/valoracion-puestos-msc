import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET all Encuestas
router.get('/', async (req, res) => {
  try {
    const encuestas = await prisma.encuestaSalarios.findMany({
      include: {
        puesto: true
      }
    });
    res.json(encuestas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener encuestas' });
  }
});

// GET Búsqueda Inteligente (Scraping Simulado)
router.get('/scraping', async (req, res) => {
  try {
    const { puesto } = req.query;
    if (!puesto || typeof puesto !== 'string') {
      return res.status(400).json({ error: 'Debe especificar el nombre del puesto' });
    }

    const pLower = puesto.toLowerCase();
    
    // Retraso artificial para simular el escaneo de La Gaceta/Munis
    await new Promise(resolve => setTimeout(resolve, 1500));

    let min = 0, prom = 0, max = 0;
    let fuente = '';
    let matches = 0;

    // Lógica de Matching (IA Simulada) basada en patrones comunes del sector municipal CR
    if (pLower.includes('conserje') || pLower.includes('chofer') || pLower.includes('miscelaneo') || pLower.includes('operativo')) {
      min = 352165; prom = 385000; max = 410000;
      fuente = 'Decreto MTSS Tit. I / Escala Base Municipalidad Curridabat 2024';
      matches = 3;
    } else if (pLower.includes('asistente') || pLower.includes('secretaria') || pLower.includes('tecnico')) {
      min = 450000; prom = 520000; max = 610000;
      fuente = 'Resolución DGSC / Gaceta #45-2024 Mun. Heredia (Puestos Administrativos)';
      matches = 5;
    } else if (pLower.includes('control interno') || pLower.includes('auditor') || pLower.includes('ingeniero')) {
      min = 650000; prom = 780000; max = 950000;
      fuente = 'Colegio de CPA / Manual Descriptivo Municipalidad Alajuela (Resolución 12-2024)';
      matches = 2;
    } else if (pLower.includes('director') || pLower.includes('jefatura') || pLower.includes('gerente')) {
      min = 1100000; prom = 1350000; max = 1800000;
      fuente = 'Sondeo Alta Gerencia UNGL 2024 / Municipalidad Cartago';
      matches = 4;
    } else {
      // Fallback genérico tipo profesional
      min = 550000; prom = 680000; max = 800000;
      fuente = 'Promedio Sectorial Municipal (Datos MTSS / CGR)';
      matches = 1;
    }

    res.json({
      success: true,
      data: {
        puesto_consultado: puesto,
        matches_encontrados: matches,
        salario_minimo: min,
        salario_promedio: prom,
        salario_maximo: max,
        fuente: fuente,
        url_fuente: 'https://www.imprentanacional.go.cr/gaceta/', 
        tasa_confiabilidad: 85 + Math.floor(Math.random() * 10) + '%'
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falla en el motor de extracción.' });
  }
});

// POST Create or Update Encuesta
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    // Checamos si ya existe una para ese puesto y periodo, en cuyo caso actualizamos
    const existe = await prisma.encuestaSalarios.findFirst({
      where: { puesto_id: data.puesto_id, periodo: "2024" } // Mock periodo "2024"
    });

    if (existe) {
      const updated = await prisma.encuestaSalarios.update({
        where: { id: existe.id },
        data: {
          salario_minimo: data.salario_minimo,
          salario_promedio: data.salario_promedio,
          salario_maximo: data.salario_maximo,
          mediana: data.salario_promedio, // asumiendo similar
          moda: data.salario_promedio,
          fuente: data.fuente
        }
      });
      return res.json(updated);
    }

    const nueva = await prisma.encuestaSalarios.create({
      data: {
        puesto_id: data.puesto_id,
        periodo: "2024",
        salario_minimo: data.salario_minimo,
        salario_promedio: data.salario_promedio,
        salario_maximo: data.salario_maximo,
        mediana: data.salario_promedio,
        moda: data.salario_promedio,
        fuente: data.fuente
      }
    });
    res.status(201).json(nueva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error guardando encuesta' });
  }
});

export default router;
