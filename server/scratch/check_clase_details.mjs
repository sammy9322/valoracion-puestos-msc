import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase
    .from('clases_puesto')
    .select('*')
    .eq('nombre', 'Jefe Municipal 5')
    .single();

  if (error) {
    console.error(error);
  } else {
    console.log('Detalle keys:', Object.keys(data.detalle || {}));
    if (data.detalle.proposito) console.log('Proposito:', data.detalle.proposito);
    if (data.detalle.tareas) console.log('Tareas count:', data.detalle.tareas.length);
  }
}

inspect();
