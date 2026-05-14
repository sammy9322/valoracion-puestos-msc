import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const rpcs = ['get_puesto_detalle', 'get_cargo_detalle', 'get_catalogo_detalle'];
  for (const rpc of rpcs) {
    const { data, error } = await supabase.rpc(rpc, { id: 131 });
    if (!error) {
      console.log(`RPC ${rpc} works!`);
      console.log(data);
    } else {
      console.log(`RPC ${rpc} failed: ${error.message}`);
    }
  }
}

inspect();
