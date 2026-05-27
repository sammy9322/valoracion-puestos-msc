import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const db = createClient(supabaseUrl, supabaseKey);

async function check() {
  const areaTarget = "Control Interno";
  const { data: depto } = await db.from('departamentos').select('codigo, nombre, nombre_sim').ilike('nombre', `%${areaTarget}%`);
  console.log("Depto match:", depto);
  
  if (depto && depto.length > 0) {
    const deptoCodigo = depto[0].codigo;
    const { data: procs } = await db.from('procedimientos').select('codigo, nombre').eq('departamento', deptoCodigo);
    console.log(`Procs for ${deptoCodigo}:`, procs?.length);
    
    if (procs && procs.length > 0) {
      const codigos = procs.map(p => p.codigo);
      const { data: pasos } = await db.from('pasos_procedimiento').select('responsable, procedimiento_codigo').in('procedimiento_codigo', codigos);
      const responsables = [...new Set(pasos?.map(p => p.responsable))];
      console.log("Unique Responsables in steps:", responsables);
    }
  }
}
check();
