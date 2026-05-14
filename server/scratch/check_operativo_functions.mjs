import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase
    .from('cargos_puesto')
    .select('*')
    .eq('clase_id', 1); // Operativo Municipal 1

  if (error) {
    console.error(error);
  } else {
    data.forEach(row => {
      console.log(`Cargo: ${row.nombre}`);
      console.log('Functions Sample:', row.funciones?.slice(0, 3));
    });
  }
}

inspect();
