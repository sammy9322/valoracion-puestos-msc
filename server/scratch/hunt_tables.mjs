import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  // Try to find ANY table that has the word 'manual' or 'fichas' or 'completo'
  const tablesToTry = [
    'manual_completo', 'fichas_puesto', 'v_catalogo_detallado', 
    'catalogo_msc', 'puestos_msc', 'v_fichas_puesto'
  ];
  
  for (const t of tablesToTry) {
    const { error } = await supabase.from(t).select('count').limit(1);
    if (!error) console.log('Found table:', t);
  }
}

inspect();
