import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase
    .rpc('get_tables'); // Hope there is an RPC for this, if not I'll try raw query

  if (error) {
    // If RPC fails, try a normal query that might work depending on Supabase config
    console.log('RPC failed, trying manual check on common tables...');
    const tables = ['cargos_puesto', 'clases_puesto', 'v_catalogo_puestos', 'manual_msc', 'puestos'];
    for (const t of tables) {
      const { error: e } = await supabase.from(t).select('count').limit(1);
      console.log(`Table ${t}: ${e ? 'No' : 'Yes'}`);
    }
  } else {
    console.log('Tables:', data);
  }
}

inspect();
