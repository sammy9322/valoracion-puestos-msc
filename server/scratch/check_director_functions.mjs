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
    .eq('nombre', 'Director de Hacienda Municipal')
    .single();

  if (error) {
    console.error(error);
  } else {
    console.log('Functions for Director de Hacienda Municipal:');
    console.log(JSON.stringify(data.funciones, null, 2));
  }
}

inspect();
