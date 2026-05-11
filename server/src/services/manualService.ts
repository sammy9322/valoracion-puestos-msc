import prisma from '../db';
import fs from 'fs';
import path from 'path';

const MANUAL_PATH = path.join(__dirname, '../../manual_vigente.json');

export const manualService = {
  /**
   * Guarda el catálogo enriquecido en la DB Local (Prisma) y gestiona el histórico
   */
  async guardarCatalogoEnriquecido(manualData: any) {
    const versionLabel = `Manual ${new Date().toLocaleDateString()} - v${manualData.version || '1.0'}`;
    
    try {
      // 1. Obtener datos actuales para el histórico
      const currentData = await prisma.manualEnriquecido.findMany();

      if (currentData && currentData.length > 0) {
        // 2. Guardar en el Histórico Local
        await prisma.manualHistorico.create({
          data: {
            version_label: versionLabel,
            data_json: JSON.stringify({
              resumen: manualData.resumen,
              catalogo: currentData
            })
          }
        });
        console.log('Versión anterior archivada en histórico local.');
      }

      // 3. Limpiar tabla activa localmente
      await prisma.manualEnriquecido.deleteMany({});

      // 4. Insertar nuevos puestos enriquecidos a partir de la jerarquía de clases
      const todosLosCargos = manualData.clases.flatMap((c: any) => 
        c.cargos.map((cargo: any) => ({
          ...cargo,
          clase: c.nombre_clase,
          estrato: c.estrato
        }))
      );

      const recordsToInsert = todosLosCargos.map((p: any) => ({
        cargo_id: p.cargo_id ? String(p.cargo_id) : null,
        nombre_oficial: p.nombre_oficial,
        nombre_pdf: p.nombre,
        funciones: JSON.stringify(p.funciones || []),
        requisitos_academicos: p.requisitos?.academicos || '',
        requisitos_experiencia: p.requisitos?.experiencia || '',
        area_sugerida: p.area || '',
        clase_manual: p.clase,
        estrato: p.estrato,
        version_label: versionLabel
      }));

      // Inserción masiva en SQLite
      await prisma.manualEnriquecido.createMany({
        data: recordsToInsert
      });

      // 5. Actualizar caché local
      fs.writeFileSync(MANUAL_PATH, JSON.stringify(manualData, null, 2));

      return { success: true, count: recordsToInsert.length };
    } catch (error) {
      console.error('Error en manualService (Local):', error);
      throw error;
    }
  },

  /**
   * Recupera el catálogo enriquecido activo de la DB Local
   */
  async getManualActivo() {
    try {
      const data = await prisma.manualEnriquecido.findMany({
        orderBy: { nombre_pdf: 'asc' }
      });
      
      return data.map(p => ({
        ...p,
        funciones: JSON.parse(p.funciones)
      }));
    } catch (error) {
      // Fallback a archivo si falla DB
      if (fs.existsSync(MANUAL_PATH)) {
        return JSON.parse(fs.readFileSync(MANUAL_PATH, 'utf-8'));
      }
      throw error;
    }
  }
};
