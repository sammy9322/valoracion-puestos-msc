import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase
    .from('clases_puesto')
    .select('nombre, detalle');

  if (error) {
    console.error(error);
  } else {
    data.forEach(row => {
      const keys = Object.keys(row.detalle || {});
      if (keys.includes('funciones') || keys.includes('proposito') || keys.includes('tareas')) {
        console.log(`Class ${row.nombre} has keys:`, keys);
      }
    });
  }
}

inspect();
