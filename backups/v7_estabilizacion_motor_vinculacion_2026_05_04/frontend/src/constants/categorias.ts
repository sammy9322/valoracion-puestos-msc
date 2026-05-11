/**
 * TABLA DE CALIBRACIÓN OFICIAL - MUNICIPALIDAD DE SAN CARLOS
 * Extraído de: erp-msc.netlify.app/web/calibracion
 */

export interface CategoriaProfesional {
  id: string;
  nombre: string;
  puntos_base: number;
  descripcion: string;
  color: string;
}

export const CATEGORIAS_PROFESIONALES: CategoriaProfesional[] = [
  {
    id: 'p1',
    nombre: 'Profesional 1',
    puntos_base: 480,
    descripcion: 'Nivel Bachillerato Universitario',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    id: 'p2',
    nombre: 'Profesional 2',
    puntos_base: 495,
    descripcion: 'Nivel Licenciatura + Incorporación',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  },
  {
    id: 'p3',
    nombre: 'Profesional 3',
    puntos_base: 540,
    descripcion: 'Nivel Licenciatura + Coordinación técnica',
    color: 'text-amber-600 bg-amber-50 border-amber-200'
  },
  {
    id: 'p4',
    nombre: 'Profesional 4',
    puntos_base: 585,
    descripcion: 'Nivel Licenciatura + Maestría / Jefas de área',
    color: 'text-rose-600 bg-rose-50 border-rose-200'
  }
];

/**
 * Retorna la categoría correspondiente según el puntaje obtenido.
 */
export const getCategoriaByPuntos = (puntos: number): CategoriaProfesional | null => {
  // Ordenar categorías de mayor a menor puntaje base para encontrar la más alta cumplida
  const sorted = [...CATEGORIAS_PROFESIONALES].sort((a, b) => b.puntos_base - a.puntos_base);
  
  for (const cat of sorted) {
    if (puntos >= cat.puntos_base) {
      return cat;
    }
  }
  
  return null; // Caso de puestos operativos o técnicos ( < 480 pts )
};
