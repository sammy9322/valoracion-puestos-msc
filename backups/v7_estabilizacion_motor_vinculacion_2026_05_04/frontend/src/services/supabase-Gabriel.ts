import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  // 1. Get the cargo from the catalog view
  const { data: cargo, error: cargoError } = await supabase
    .from('v_catalogo_puestos')
    .select('*')
    .eq('cargo_id', cargoId)
    .single();

  if (cargoError) throw cargoError;

  // 2. Get the detailed functions from cargos_puesto
  const { data: cargoDetalle } = await supabase
    .from('cargos_puesto')
    .select('*')
    .eq('nombre', cargo.cargo)
    .single();

  // 3. Get the class details (education, experience, etc.) from clases_puesto
  const { data: claseDetalle } = await supabase
    .from('clases_puesto')
    .select('*')
    .eq('nombre', cargo.clase)
    .single();

  // Build functions text from the funciones array
  let funcionesTexto = '';
  if (cargoDetalle?.funciones && Array.isArray(cargoDetalle.funciones)) {
    funcionesTexto = cargoDetalle.funciones.map((f: string) => `• ${f}`).join('\n');
  }

  // Extract requirements from clases_puesto.detalle JSON
  const detalle = claseDetalle?.detalle || {};
  const requisitos = detalle.requisitos_minimos || {};

  return {
    ...cargo,
    funciones_detalladas: funcionesTexto,
    requisitos_educacion: requisitos.academicos || '',
    requisitos_experiencia: requisitos.experiencia_laboral || '',
    naturaleza: claseDetalle?.naturaleza || '',
  };
};

export const getDepartmentByCargo = async (cargoNombre: string) => {
  try {
    const subprocesos = await getSubprocesos();
    const cargoLower = cargoNombre.toLowerCase();

    // Scoring dictionary for specific keywords
    const keywordWeights: { [key: string]: string } = {
      'control interno': 'DCI',
      'auditoria': 'DCI',
      'tecnologias': 'TIC',
      'informatica': 'TIC',
      'sistemas': 'TIC',
      'recursos humanos': 'DRH',
      'personal': 'DRH',
      'tesoreria': 'TES',
      'contabilidad': 'CON',
      'presupuesto': 'PRE',
      'alcaldia': 'ALC',
      'secretaria': 'SEC',
      'consejo': 'SEC',
      'juridico': 'AJU',
      'legal': 'AJU',
      'servicios': 'SEM',
      'obras': 'UTG',
      'vias': 'UTG',
      'acueducto': 'ACU',
      'agua': 'ACU',
      'cementerio': 'CEM',
      'catastro': 'CAT',
      'valoracion': 'CAT',
      'lector': 'ACU',
      'hidrometro': 'ACU',
      'conserje': 'SEM'
    };

    // Check specific keywords first
    for (const [kw, dept] of Object.entries(keywordWeights)) {
      if (cargoLower.includes(kw)) {
        return dept;
      }
    }

    // Scoring based on subproceso names and descriptions
    let bestDept = '';
    let maxScore = 0;

    for (const sp of subprocesos) {
      let score = 0;
      const spNombre = (sp.nombre || '').toLowerCase();
      const spDesc = (sp.descripcion || '').toLowerCase();

      if (spNombre.includes(cargoLower) || cargoLower.includes(spNombre)) score += 10;
      
      const words = cargoLower.split(' ').filter(w => w.length > 3);
      words.forEach(word => {
        if (spNombre.includes(word)) score += 5;
        if (spDesc.includes(word)) score += 2;
      });

      if (score > maxScore) {
        maxScore = score;
        bestDept = sp.departamento_codigo;
      }
    }

    return maxScore > 3 ? bestDept : '';
  } catch (err) {
    console.error('Error mapping department:', err);
    return '';
  }
};
