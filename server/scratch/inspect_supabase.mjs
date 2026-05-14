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
    .limit(5);

  if (error) {
    console.error(error);
  } else {
    console.log('Sample from v_catalogo_puestos:');
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Inspect classes_puesto as well
  const { data: classes, error: classError } = await supabase
    .from('clases_puesto')
    .select('*')
    .limit(5);
    
  if (classError) {
    console.error(classError);
  } else {
    console.log('\nSample from clases_puesto:');
    console.log(JSON.stringify(classes, null, 2));
  }
}

inspect();
