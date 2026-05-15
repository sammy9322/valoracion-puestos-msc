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

/**
 * Encuentra el estrato mas cercano por puntaje sin excederlo.
 */
export const getEstratoSugerido = (puntos: number): ClaseMunicipal | null => {
      if (!puntos) return null;

      // Filtramos y ordenamos por puntos de forma descendente para encontrar el mas alto posible que no exceda el puntaje
      const candidatos = [...ESTRATOS_MUNICIPALES]
          .filter(e => e.puntos <= puntos)
          .sort((a, b) => b.puntos - a.puntos);

      return candidatos.length > 0 ? candidatos[0] : null;
};
