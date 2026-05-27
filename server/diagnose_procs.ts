import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno (asume que se corre dentro de /server)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Soporte para .env.vercel o variables locales si existen
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ No se encontraron las credenciales de Supabase en las variables de entorno.");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function diagnosticarPuesto(nombrePuesto: string, nombreArea: string) {
  console.log(`\n🔍 INICIANDO DIAGNÓSTICO PARA: "${nombrePuesto}" (Área: ${nombreArea})`);
  
  // 1. Buscar Departamento
  const { data: deptos, error: errDepto } = await db
    .from('departamentos')
    .select('codigo, nombre, nombre_sim')
    .ilike('nombre', `%${nombreArea}%`);

  if (errDepto || !deptos || deptos.length === 0) {
    console.log(`❌ No se encontró el departamento usando el texto: "${nombreArea}"`);
    return;
  }
  
  const depto = deptos[0];
  console.log(`✅ Departamento encontrado: [${depto.codigo}] ${depto.nombre}`);

  // 2. Buscar Procedimientos del Departamento
  const { data: procs, error: errProcs } = await db
    .from('procedimientos')
    .select('codigo, nombre')
    .eq('departamento', depto.codigo);

  if (errProcs || !procs || procs.length === 0) {
    console.log(`❌ No hay procedimientos registrados en la base de datos para el departamento ${depto.codigo}`);
    return;
  }
  console.log(`✅ Se encontraron ${procs.length} procedimientos en este departamento.`);

  // 3. Buscar Responsables en los Pasos
  const codigosProcs = procs.map(p => p.codigo);
  const { data: pasos, error: errPasos } = await db
    .from('pasos_procedimiento')
    .select('responsable')
    .in('procedimiento_codigo', codigosProcs);

  if (errPasos || !pasos || pasos.length === 0) {
    console.log(`❌ Los procedimientos no tienen pasos registrados.`);
    return;
  }

  // Extraer responsables únicos
  const responsablesUnicos = [...new Set(pasos.map(p => p.responsable).filter(Boolean))];
  console.log(`📋 Lista de "Responsables" encontrados en los pasos de estos procedimientos:`);
  responsablesUnicos.forEach(r => console.log(`   - "${r}"`));

  // 4. Prueba del Filtro Exacto del Código
  const coincidencia = responsablesUnicos.some(r => 
    (r as string).toLowerCase().includes(nombrePuesto.toLowerCase()) ||
    nombrePuesto.toLowerCase().includes((r as string).toLowerCase())
  );

  if (coincidencia) {
    console.log(`\n✅ RESULTADO: ¡Éxito! El sistema DEBERÍA estar encontrando coincidencia para "${nombrePuesto}".`);
  } else {
    console.log(`\n❌ RESULTADO: Ninguno de los responsables listados arriba coincide con el texto "${nombrePuesto}". Por esto la app los descarta.`);
  }
  console.log("---------------------------------------------------");
}

async function run() {
  await diagnosticarPuesto("Encargado de Control Interno", "Control Interno");
  await diagnosticarPuesto("Encargado de Salud Ocupacional", "Salud Ocupacional");
}

run();
