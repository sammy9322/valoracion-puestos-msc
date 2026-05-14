import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase
    .from('cargos_puesto')
    .select('nombre, funciones');

  if (!error && data) {
    let count = 0;
    for (const row of data) {
      if (JSON.stringify(row.funciones).includes('Dirigir')) {
        console.log(`Cargo ${row.nombre} has 'Dirigir'`);
        count++;
        if (count > 5) break;
      }
    }
    if (count === 0) console.log('No cargo has "Dirigir" in functions');
  }
}

inspect();
