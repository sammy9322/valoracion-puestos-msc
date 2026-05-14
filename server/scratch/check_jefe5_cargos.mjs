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
    .eq('clase_id', 28); // Jefe Municipal 5

  if (error) {
    console.error(error);
  } else {
    console.log('Cargos for Jefe Municipal 5:');
    data.forEach(row => {
      console.log(`ID: ${row.id} | Nombre: ${row.nombre} | Funciones count: ${row.funciones?.length || 0}`);
    });
  }
}

inspect();
