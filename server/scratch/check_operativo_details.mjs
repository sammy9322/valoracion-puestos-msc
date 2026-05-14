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
    .eq('nombre', 'Operativo Municipal 1')
    .single();

  if (error) {
    console.error(error);
  } else {
    console.log('Keys for Operativo Municipal 1 Detalle:', Object.keys(data.detalle || {}));
  }
}

inspect();
