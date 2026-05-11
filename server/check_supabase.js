const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  // 1. Verificar v_catalogo_puestos
  const { data: catalogo, error: e1 } = await supabase
    .from('v_catalogo_puestos')
    .select('*')
    .limit(3);
  console.log('=== v_catalogo_puestos (3 registros) ===');
  console.log(JSON.stringify(catalogo, null, 2));
  if (e1) console.error('ERROR:', e1);

  // 2. Verificar cargos_puesto (para las funciones)
  const { data: cargos, error: e2 } = await supabase
    .from('cargos_puesto')
    .select('*')
    .limit(3);
  console.log('\n=== cargos_puesto (3 registros) ===');
  console.log(JSON.stringify(cargos, null, 2));
  if (e2) console.error('ERROR:', e2);

  // 3. Verificar clases_puesto (para naturaleza y requisitos)
  const { data: clases, error: e3 } = await supabase
    .from('clases_puesto')
    .select('*')
    .limit(2);
  console.log('\n=== clases_puesto (2 registros) ===');
  console.log(JSON.stringify(clases, null, 2));
  if (e3) console.error('ERROR:', e3);
}

main().catch(console.error);
