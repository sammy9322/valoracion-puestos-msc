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
    .limit(1);

  if (error) {
    console.error(error);
  } else {
    console.log('All keys in v_catalogo_puestos:', Object.keys(data[0]));
  }
}

inspect();
