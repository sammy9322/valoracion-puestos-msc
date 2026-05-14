import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase
    .from('clases_puesto')
    .select('*');

  if (!error && data) {
    for (const row of data) {
      const json = JSON.stringify(row);
      if (json.includes('Dirigir')) {
        console.log(`Found 'Dirigir' in class ${row.nombre}`);
        // Find where it is
        if (row.naturaleza?.includes('Dirigir')) console.log('In naturaleza');
        if (JSON.stringify(row.detalle).includes('Dirigir')) {
           console.log('In detalle. Checking subkeys...');
           for (const k of Object.keys(row.detalle)) {
             if (JSON.stringify(row.detalle[k]).includes('Dirigir')) console.log(`In k: ${k}`);
           }
        }
      }
    }
  }
}

inspect();
