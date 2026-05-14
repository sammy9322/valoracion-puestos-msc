import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const getCargosPuesto = async () => {
  const { data, error } = await supabase.from('v_catalogo_puestos').select('*');
  if (error) throw error;
  return data;
};

export const getSubprocesos = async () => {
  const { data, error } = await supabase.from('subprocesos').select('*');
  if (error) throw error;
  return data;
};

export const getDepartamentos = async () => {
  const { data, error } = await supabase.from('departamentos').select('*');
  if (error) throw error;
  return data;
};

export const getCargoDetails = async (cargoId: string) => {
  // cargo_id en Supabase es un entero, se castea antes del query
  const { data: cargo, error: cargoError } = await supabase
    .from('v_catalogo_puestos')
    .select('*')
    .eq('cargo_id', parseInt(cargoId, 10))
    .single();

  if (cargoError || !cargo) {
    console.error('Error obteniendo cargo de v_catalogo_puestos:', cargoError);
    throw cargoError || new Error('Cargo no encontrado');
  }

  // Buscar funciones específicas del cargo
  const { data: cargoDetalle } = await supabase
    .from('cargos_puesto')
    .select('*')
    .eq('nombre', cargo.cargo)
    .single();

  // Buscar detalle de la clase (naturaleza + requisitos)
  const { data: claseDetalle } = await supabase
    .from('clases_puesto')
    .select('*')
    .eq('nombre', cargo.clase)
    .single();

  // Limpiar el estrato y añadir el grado (orden_clase)
  const estratoBase = (cargo.estrato || '').replace(/^Estrato\s+/i, '').trim();
  // El grado viene de orden_clase (ej: Técnico 1, Profesional 4)
  const grado = cargo.orden_clase || '';
  const estratoCompleto = grado ? `${estratoBase} ${grado}` : estratoBase;

  // Formatear funciones como texto con viñetas
  let funcionesTexto = '';
  if (cargoDetalle?.funciones && Array.isArray(cargoDetalle.funciones)) {
    funcionesTexto = cargoDetalle.funciones.map((f: string) => `• ${f}`).join('\n');
  }

  // Extraer requisitos del campo JSONB 'detalle'
  const detalle = claseDetalle?.detalle || {};
  const requisitos = detalle.requisitos_minimos || {};

  return {
    ...cargo,
    estrato: estratoCompleto,
    funciones_detalladas: funcionesTexto,
    requisitos_educacion: requisitos.academicos || '',
    requisitos_experiencia: requisitos.experiencia_laboral || '',
    naturaleza: (claseDetalle?.naturaleza || '').trim(),
  };
};

