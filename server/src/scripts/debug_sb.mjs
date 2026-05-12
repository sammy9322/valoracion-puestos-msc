import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Conectando a Supabase:', supabaseUrl);
  const { data, error } = await supabase
    .from('v_catalogo_puestos')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error al consultar v_catalogo_puestos:', error);
  } else {
    console.log('Datos encontrados:', data?.length || 0);
    console.log('Muestra:', data);
  }
}

test();
