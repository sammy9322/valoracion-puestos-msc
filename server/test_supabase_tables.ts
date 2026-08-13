import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en el .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Connecting to Supabase:', SUPABASE_URL);

  // 1. Consultar todos los procedimientos de Control Interno usando el código "DCI"
  console.log('\n--- 1. Querying procedimientos for departamento = "DCI" or "Control Interno" ---');
  const { data: procs1, error: e1 } = await supabase
    .from('procedimientos')
    .select('*')
    .or('departamento.eq.DCI,departamento_codigo.eq.DCI,departamento.eq.Control Interno');
  
  if (e1) {
    console.error('Error querying procedimientos:', e1);
  } else {
    console.log(`Found ${procs1?.length} procedures for DCI:`);
    console.log(JSON.stringify(procs1, null, 2));
  }

  // 2. Buscar cargos_puesto relacionados con "Asistente de Control Interno" o "Control Interno"
  console.log('\n--- 2. Searching cargos_puesto for Control Interno related titles ---');
  const { data: cargos, error: e2 } = await supabase
    .from('cargos_puesto')
    .select('*')
    .or('nombre.ilike.%control%,nombre.ilike.%asistente%');
  
  if (e2) {
    console.error('Error querying cargos_puesto:', e2);
  } else {
    console.log(`Found ${cargos?.length} cargos matching keywords:`);
    console.log(JSON.stringify(cargos, null, 2));
  }

  // 3. Buscar en pasos_procedimiento donde el responsable o la descripción mencione Control Interno o Asistente
  console.log('\n--- 3. Searching for Control Interno / Asistente references in steps ---');
  const { data: pasos, error: e3 } = await supabase
    .from('pasos_procedimiento')
    .select('*')
    .or('responsable.ilike.%control%,responsable.ilike.%asistente%,descripcion.ilike.%control interno%,descripcion.ilike.%asistente%')
    .limit(10);
  
  if (e3) {
    console.error('Error querying pasos_procedimiento:', e3);
  } else {
    console.log(`Found ${pasos?.length} steps matching keywords (sample limit 10):`);
    console.log(JSON.stringify(pasos, null, 2));
  }
}

main().catch(console.error);
