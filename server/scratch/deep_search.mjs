import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  // Trying to find any table that has 'Alcalde' AND 'Dirigir y coordinar'
  // I'll check all tables I've seen so far + common guesses
  const tables = ['cargos_puesto', 'clases_puesto', 'puestos', 'manual_msc', 'fichas', 'catalogo_puesto', 'manual_enriquecido'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .ilike('nombre', '%Alcalde%')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        console.log(`Table ${table} has Alcalde. Checking columns...`);
        console.log(Object.keys(data[0]));
        // Search for 'Dirigir' in any string column
        for (const key of Object.keys(data[0])) {
          if (typeof data[0][key] === 'string' && data[0][key].includes('Dirigir')) {
            console.log(`Found 'Dirigir' in column ${key} of table ${table}`);
          }
          if (Array.isArray(data[0][key])) {
             if (data[0][key].some(f => typeof f === 'string' && f.includes('Dirigir'))) {
               console.log(`Found 'Dirigir' in array column ${key} of table ${table}`);
             }
          }
        }
      }
    } catch (e) {}
  }
}

inspect();
