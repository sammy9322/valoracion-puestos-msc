// Test directo a Supabase con fetch nativo
const SUPABASE_URL = 'https://ixfirqxhrjvnerpsetlp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4ZmlycXhocmp2bmVycHNldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjEwNzAsImV4cCI6MjA5MTIzNzA3MH0.d1W6sK4rW12S3aX75cXES8IrVqmEBauLRTJvHFZt4xU';

async function query(table, limit = 2) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  return data;
}

async function main() {
  console.log('\n=== v_catalogo_puestos (2 registros) ===');
  const catalogo = await query('v_catalogo_puestos');
  console.log(JSON.stringify(catalogo, null, 2));

  if (catalogo && catalogo.length > 0) {
    const firstCargoId = catalogo[0].cargo_id;
    const firstNombre = catalogo[0].cargo;
    console.log(`\n=== Buscando en cargos_puesto por nombre: "${firstNombre}" ===`);
    const url2 = `${SUPABASE_URL}/rest/v1/cargos_puesto?nombre=eq.${encodeURIComponent(firstNombre)}&limit=1`;
    const r2 = await fetch(url2, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const c2 = await r2.json();
    console.log(JSON.stringify(c2, null, 2));
  }

  console.log('\n=== clases_puesto (1 registro) ===');
  const clases = await query('clases_puesto', 1);
  console.log(JSON.stringify(clases, null, 2));
}

main().catch(console.error);
