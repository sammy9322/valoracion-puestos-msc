export interface ClaseMunicipal {
      nombre: string;
      puntos: number;
      color: string;
      serie: string;
}


export const ESTRATOS_MUNICIPALES: ClaseMunicipal[] = [
      // Serie Operativa
  { nombre: 'Operativo Municipal 1', puntos: 140, serie: 'Operativa', color: 'bg-slate-100 border-slate-300 text-slate-700' },
  { nombre: 'Operativo Municipal 2', puntos: 170, serie: 'Operativa', color: 'bg-slate-100 border-slate-300 text-slate-700' },
  { nombre: 'Operativo Municipal 3', puntos: 210, serie: 'Operativa', color: 'bg-slate-100 border-slate-300 text-slate-700' },
  { nombre: 'Operativo Municipal 4', puntos: 260, serie: 'Operativa', color: 'bg-slate-100 border-slate-300 text-slate-700' },
  { nombre: 'Operativo Municipal 5', puntos: 265, serie: 'Operativa', color: 'bg-slate-100 border-slate-300 text-slate-700' },
  { nombre: 'Operativo Municipal 6', puntos: 355, serie: 'Operativa', color: 'bg-slate-100 border-slate-300 text-slate-700' },

      // Serie Administrativa
  { nombre: 'Administrativo Municipal 1', puntos: 255, serie: 'Administrativa', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { nombre: 'Administrativo Municipal 2', puntos: 270, serie: 'Administrativa', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { nombre: 'Administrativo Municipal 3', puntos: 280, serie: 'Administrativa', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { nombre: 'Administrativo Municipal 4', puntos: 355, serie: 'Administrativa', color: 'bg-blue-50 border-blue-200 text-blue-700' },

      // Serie Policia
  { nombre: 'Policia Municipal 1', puntos: 210, serie: 'Policia', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { nombre: 'Policia Municipal 2', puntos: 280, serie: 'Policia', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { nombre: 'Policia Municipal 3', puntos: 270, serie: 'Policia', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { nombre: 'Policia Municipal 4', puntos: 330, serie: 'Policia', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { nombre: 'Policia Municipal 5', puntos: 345, serie: 'Policia', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },

      // Serie Tecnica
  { nombre: 'Tecnico Municipal 1', puntos: 270, serie: 'Tecnica', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { nombre: 'Tecnico Municipal 2', puntos: 330, serie: 'Tecnica', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { nombre: 'Tecnico Municipal 3', puntos: 390, serie: 'Tecnica', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },

      // Serie Profesional
  { nombre: 'Profesional Municipal 1', puntos: 375, serie: 'Profesional', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { nombre: 'Profesional Municipal 1 (Prohib.)', puntos: 415, serie: 'Profesional', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { nombre: 'Profesional Municipal 2', puntos: 410, serie: 'Profesional', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { nombre: 'Profesional Municipal 2 (Prohib.)', puntos: 440, serie: 'Profesional', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { nombre: 'Profesional Municipal 3', puntos: 455, serie: 'Profesional', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { nombre: 'Profesional Municipal 3 (Prohib.)', puntos: 485, serie: 'Profesional', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { nombre: 'Profesional Municipal 4', puntos: 605, serie: 'Profesional', color: 'bg-orange-100 border-orange-300 text-orange-700' },
  { nombre: 'Profesional Municipal 4 (Prohib.)', puntos: 610, serie: 'Profesional', color: 'bg-orange-100 border-orange-300 text-orange-700' },

      // Serie Jefatura
  { nombre: 'Profesional Jefe 1', puntos: 645, serie: 'Jefatura', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { nombre: 'Profesional Jefe 2 (Prohib.)', puntos: 700, serie: 'Jefatura', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { nombre: 'Profesional Jefe 3 (Prohib.)', puntos: 800, serie: 'Jefatura', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { nombre: 'Profesional Jefe 4 (Prohib.)', puntos: 845, serie: 'Jefatura', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { nombre: 'Profesional Jefe 5 (Prohib.)', puntos: 880, serie: 'Jefatura', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  ];

export function determinarSerie(nombre: string, educacion?: string, claseMsc?: string): string {
  const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ed = (educacion || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cl = (claseMsc || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Jefatura (debe excluir estrictamente asistentes/auxiliares)
  if (/jefe|jefatura|director|gerente|subdirector|coordinador|encargado/i.test(cl) || 
      (/director|gerente|subdirector|jefe|jefatura|coordinador|encargado/i.test(n) && !/asistente|auxiliar/i.test(n))) {
    if (/asistente|auxiliar/i.test(n)) {
      return 'Profesional'; // Cae a profesional si requiere educación profesional
    }
    return 'Jefatura';
  }

  // 2. Profesional (según educación académica o clase explícita de la ficha)
  if (/profesional/i.test(cl) || 
      /profesional|ingeniero|abogado|arquitecto|medico|psicologo|trabajador social|auditor|licenciado|analista/i.test(n) ||
      /bachiller\s+universitario|licenciatura|grado\s+universitario|universitario|licenciado|maestria|postgrado|especializacion/i.test(ed)) {
    return 'Profesional';
  }

  // 3. Técnica
  if (/tecnico|técnico/i.test(cl) || 
      /tecnico|técnico|dibujante|soporte|inspector/i.test(n) || 
      /diplomado|tecnico\s+superior/i.test(ed) ||
      /tecnico/i.test(ed)) {
    return 'Tecnica';
  }

  // 4. Policía
  if (/policia|policía/i.test(cl) || 
      /policia|policía|seguridad|vigilante|guardia|transito|tránsito/i.test(n)) {
    return 'Policia';
  }

  // 5. Administrativa
  if (/administrativo|auxiliar|asistente|secretaria|recepcionista|archivista|oficinista|cajero/i.test(cl) || 
      /auxiliar|asistente|secretaria|recepcionista|archivista|oficinista|cajero|administrativo/i.test(n)) {
    return 'Administrativa';
  }

  // 6. Operativa
  if (/operativo|operario|peon|peón|conserje|chofer|mensajero|limpieza|mantenimiento|jardinero|cocinero/i.test(cl) || 
      /operario|peon|peón|conserje|chofer|mensajero|limpieza|mantenimiento|jardinero|cocinero|miscelaneo|miscelánea/i.test(n)) {
    return 'Operativa';
  }

  return 'Operativa'; // Conservador por defecto
}

/**
 * Encuentra el estrato más cercano por puntaje sin excederlo y aplicando la acotación de serie.
 */
export const getEstratoSugerido = (puntos: number, nombrePuesto?: string, claseMsc?: string, educacion?: string, estratoDirecto?: string): ClaseMunicipal | null => {
  if (!puntos) return null;

  let seriePermitida: string | null = null;
  // Si el estrato directo viene desde Supabase/CatalogoPuesto, usarlo como fuente de verdad
  if (estratoDirecto) {
    const estratoNormalizado = estratoDirecto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const series = ['Operativa', 'Administrativa', 'Policia', 'Tecnica', 'Profesional', 'Jefatura'];
    const encontrada = series.find(s => estratoNormalizado.toLowerCase().includes(s.toLowerCase()));
    if (encontrada) {
      seriePermitida = encontrada;
    }
  }
  // Fallback al regex tradicional si no hay estrato directo
  if (!seriePermitida && nombrePuesto) {
    seriePermitida = determinarSerie(nombrePuesto, educacion, claseMsc);
  }

  let candidatos = [...ESTRATOS_MUNICIPALES];

  if (seriePermitida) {
    const ordenSeries = ['Operativa', 'Administrativa', 'Policia', 'Tecnica', 'Profesional', 'Jefatura'];
    const indexPermitido = ordenSeries.indexOf(seriePermitida);
    // Filtrar para no permitir clases que pertenezcan a series de jerarquía superior
    candidatos = candidatos.filter(e => {
      const idx = ordenSeries.indexOf(e.serie);
      return idx <= indexPermitido;
    });
  }

  const filtered = candidatos
    .filter(e => e.puntos <= puntos)
    .sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      return a.nombre.includes('(Prohib.)') ? 1 : -1;
    });

  if (filtered.length > 0) {
    return filtered[0];
  }

  // Si no hay clases con puntaje inferior al asignado, devolvemos la clase base de la serie permitida
  if (seriePermitida) {
    const claseMinima = ESTRATOS_MUNICIPALES.find(e => e.serie === seriePermitida);
    if (claseMinima) return claseMinima;
  }

  return candidatos.length > 0 ? candidatos[0] : null;
};

export type EstratoResult = {
  clase: ClaseMunicipal;
  esProhibida: boolean;
  alternativaNoProhibida: ClaseMunicipal | null;
};

export function getEstratoCompleto(puntos: number, nombrePuesto?: string, claseMsc?: string, educacion?: string, estratoDirecto?: string): EstratoResult | null {
  const clase = getEstratoSugerido(puntos, nombrePuesto, claseMsc, educacion, estratoDirecto);
  if (!clase) return null;
  return {
    clase,
    esProhibida: clase.nombre.includes('(Prohib.)'),
    alternativaNoProhibida: getClaseNoProhibida(clase)
  };
}

function getClaseNoProhibida(prohibida: ClaseMunicipal): ClaseMunicipal | null {
  const baseName = prohibida.nombre.replace(/\s*\(Prohib\.\)\s*$/, '');
  return ESTRATOS_MUNICIPALES.find(e => e.nombre === baseName && !e.nombre.includes('(Prohib.)')) || null;
}
