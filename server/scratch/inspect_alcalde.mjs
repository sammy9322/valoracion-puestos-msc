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
    .ilike('cargo', '%Alcalde%')
    .single();

  if (error) {
    console.error(error);
  } else {
    console.log('Details for Alcalde:');
    console.log(JSON.stringify(data, null, 2));
  }
}

inspect();
