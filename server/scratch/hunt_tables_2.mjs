import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  // Query to find all tables
  const { data: tables, error } = await supabase.from('pg_catalog.pg_tables').select('tablename').eq('schemaname', 'public');
  // Wait, Supabase client might not allow pg_catalog.
  // I'll try to guess more names or use a different approach.
  
  const commonNames = ['puestos', 'cargos', 'clases', 'manual', 'fichas', 'catalogo', 'funciones'];
  for (const name of commonNames) {
    const { data, error: e } = await supabase.from(name).select('count').limit(1);
    if (!e) console.log('Found table:', name);
  }
}

inspect();
