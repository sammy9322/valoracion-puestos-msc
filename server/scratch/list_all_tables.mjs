import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase
    .rpc('get_tables'); // If this RPC exists, it might list them.
  
  if (error) {
    // Try to list tables via a common trick if the user granted permissions
    const { data: d, error: e } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (e) {
      console.log('Could not list tables directly. Trying common table names for Job Valuation...');
      const guesses = [
        'puestos', 'cat_puestos', 'catalogo', 'manual_puestos', 'fichas', 'descripcion_puestos',
        'cargos_puesto', 'clases_puesto', 'v_catalogo_puestos'
      ];
      for (const g of guesses) {
        const { error: err } = await supabase.from(g).select('count').limit(1);
        console.log(`Table ${g}: ${err ? 'No' : 'Yes'}`);
      }
    } else {
      console.log('Tables:', d.map(t => t.tablename));
    }
  } else {
    console.log('Tables via RPC:', data);
  }
}

inspect();
