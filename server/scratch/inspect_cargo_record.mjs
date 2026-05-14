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
    .limit(1);

  if (error) {
    console.error(error);
  } else {
    console.log('Record from cargos_puesto:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

inspect();
