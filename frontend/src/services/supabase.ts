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

export const getDepartmentByCargo = async (cargoNombre: string) => {
  try {
    const subprocesos = await getSubprocesos();
    const cargoLower = cargoNombre.toLowerCase();

    const keywordWeights: { [key: string]: string } = {
      'control interno': 'DCI', 'auditoria': 'DCI',
      'tecnologias': 'TIC', 'informatica': 'TIC', 'sistemas': 'TIC',
      'recursos humanos': 'DRH', 'personal': 'DRH', 'planillas': 'DRH',
      'tesoreria': 'TES', 'contabilidad': 'CON', 'presupuesto': 'PRE',
      'alcaldia': 'ALC', 'secretaria': 'SEC', 'consejo': 'SEC',
      'juridico': 'AJU', 'legal': 'AJU', 'abogado': 'AJU',
      'servicios': 'SEM', 'mantenimiento': 'SEM', 'aseo': 'SEM', 'cementerio': 'CEM', 'mercado': 'SEM', 'maquinaria': 'SEM',
      'obras': 'UTG', 'vias': 'UTG', 'vial': 'UTG', 'infraestructura': 'UTG', 'gestion vial': 'UTG', 'operador': 'UTG',
      'acueducto': 'ACU', 'agua': 'ACU', 'hidrometro': 'ACU', 'lector': 'ACU',
      'catastro': 'CAT', 'valoracion': 'CAT', 'bienes inmuebles': 'CAT',
      'ambiental': 'GAM', 'gestion ambiental': 'GAM', 'residuos': 'GAM', 'desechos': 'GAM',
      'patentes': 'TRI', 'tributacion': 'TRI', 'cobros': 'TRI', 'hacienda': 'TRI', 'inspector': 'TRI',
      'planificacion': 'PLA', 'transito': 'PTR', 'parquimetros': 'TRI',
      'seguridad': 'SEG', 'policia': 'SEG', 'vigilante': 'SEG',
      'cultura': 'DCC', 'deporte': 'DCC', 'biblioteca': 'DCC', 'social': 'DCC',
      'conserje': 'SEM', 'chofer': 'SEM', 'mensajero': 'SEC', 'recepcionista': 'SEC'
    };

    for (const [kw, dept] of Object.entries(keywordWeights)) {
      if (cargoLower.includes(kw)) return dept;
    }

    let bestDept = '';
    let maxScore = 0;
    for (const sp of subprocesos) {
      let score = 0;
      const spNombre = (sp.nombre || '').toLowerCase();
      const spDesc = (sp.descripcion || '').toLowerCase();
      if (spNombre.includes(cargoLower) || cargoLower.includes(spNombre)) score += 10;
      const words = cargoLower.split(' ').filter((w: string) => w.length > 3);
      words.forEach((word: string) => {
        if (spNombre.includes(word)) score += 5;
        if (spDesc.includes(word)) score += 2;
      });
      if (score > maxScore) { maxScore = score; bestDept = sp.departamento_codigo; }
    }
    return maxScore > 3 ? bestDept : '';
  } catch (err) {
    console.error('Error mapping department:', err);
    return '';
  }
};
