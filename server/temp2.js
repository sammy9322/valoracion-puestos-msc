const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const cargosLocal = await prisma.manualEnriquecido.findMany();
  const { data: supabasePositions } = await supabase.from('v_catalogo_puestos').select('*');
  
  let matchCount = 0;
  for (const lp of cargosLocal) {
    const m = supabasePositions.find(p => 
      (lp.cargo_id && p.cargo_id.toString() === lp.cargo_id.toString()) || 
      (lp.nombre_oficial && p.cargo.toLowerCase().trim() === lp.nombre_oficial.toLowerCase().trim()) ||
      (p.cargo.toLowerCase().trim() === lp.nombre_pdf.toLowerCase().trim())
    );
    if (m) matchCount++;
    else console.log('NO MATCH:', lp.nombre_pdf);
  }
  console.log('Matches:', matchCount, 'out of', cargosLocal.length);
}
check().catch(console.error).finally(() => prisma.$disconnect());
