import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  // Check columns of cargos_puesto
  const { data: cargos, error: cargosError } = await supabase
    .from('cargos_puesto')
    .select('*')
    .limit(1);

  if (cargosError) {
    console.error(cargosError);
  } else {
    console.log('Columns in cargos_puesto:', Object.keys(cargos[0] || {}));
  }

  // Check columns of clases_puesto
  const { data: clases, error: clasesError } = await supabase
    .from('clases_puesto')
    .select('*')
    .limit(1);

  if (clasesError) {
    console.error(clasesError);
  } else {
    console.log('Columns in clases_puesto:', Object.keys(clases[0] || {}));
  }
}

inspect();
