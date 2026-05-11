require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function clean() {
  const { data, error } = await supabase.from('cargos_puesto').select('id, nombre, funciones');
  if (error) { console.error(error); return; }
  
  let cleaned = 0;
  for (const cargo of data) {
    const fStr = JSON.stringify(cargo.funciones || []);
    if (fStr.includes('Reglamento del Estatuto de Servicio Civil')) {
      console.log('Cleaning Supabase cargo:', cargo.nombre);
      await supabase.from('cargos_puesto').update({ funciones: [] }).eq('id', cargo.id);
      cleaned++;
    }
  }
  console.log('Cleaned', cleaned, 'cargos in Supabase');
}
clean().catch(console.error);
