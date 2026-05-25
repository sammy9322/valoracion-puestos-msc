import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ixfirqxhrjvnerpsetlp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4ZmlycXhocmp2bmVycHNldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjEwNzAsImV4cCI6MjA5MTIzNzA3MH0.d1W6sK4rW12S3aX75cXES8IrVqmEBauLRTJvHFZt4xU';

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
