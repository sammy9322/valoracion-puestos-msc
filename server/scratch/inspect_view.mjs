import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase
    .from('v_catalogo_puestos')
    .select('*')
    .limit(10);

  if (error) {
    console.error(error);
  } else {
    console.log('Sample from v_catalogo_puestos:');
    data.forEach(row => {
      console.log(`Cargo: ${row.cargo} | Estrato: ${row.estrato} | Clase: ${row.clase}`);
    });
  }
}

inspect();
