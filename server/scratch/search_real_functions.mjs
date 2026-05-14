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
    .ilike('funciones::text', '%Dirigir y coordinar%'); // Search in JSONB as text

  if (error) {
    console.error(error);
  } else {
    console.log('Results for "Dirigir y coordinar":');
    data.forEach(row => {
      console.log(`ID: ${row.id} | Name: ${row.nombre}`);
    });
  }
}

inspect();
