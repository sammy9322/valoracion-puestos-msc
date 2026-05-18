import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client) {
    if (!supabaseUrl || !supabaseKey) return null;
    client = createClient(supabaseUrl, supabaseKey);
  }
  return client;
}

export interface ProcedimientosContext {
  procedimientos: { codigo: string; nombre: string; proposito?: string; alcance?: string }[];
  pasos: { descripcion: string; procedimiento_codigo: string }[];
  politicas: { politica: string; procedimiento_codigo: string }[];
  textoCompleto: string;
  totalProcedimientos: number;
}

export async function enrich(puesto: any): Promise<ProcedimientosContext | null> {
  const db = getClient();
  if (!db || !puesto?.area) return null;

  try {
    const { data: procedimientos, error: procError }: any = await db
      .from('procedimientos')
      .select('codigo, nombre, proposito, alcance')
      .eq('departamento', puesto.area)
      .order('nombre');

    if (procError || !procedimientos?.length) return null;

    const codigos: string[] = procedimientos.map((p: any) => p.codigo);

    const [pasosRes, politicasRes] = await Promise.allSettled([
      db.from('pasos_procedimiento')
        .select('descripcion, procedimiento_codigo')
        .in('procedimiento_codigo', codigos)
        .order('secuencia'),
      db.from('politicas_operacion')
        .select('politica, procedimiento_codigo')
        .in('procedimiento_codigo', codigos)
        .order('letra'),
    ]);

    const pasos: any[] = (pasosRes.status === 'fulfilled' ? pasosRes.value.data : []) || [];
    const politicas: any[] = (politicasRes.status === 'fulfilled' ? politicasRes.value.data : []) || [];

    const partes: string[] = [];

    for (const proc of procedimientos) {
      partes.push(`\nProcedimiento: ${proc.nombre} (${proc.codigo})`);
      if (proc.proposito) partes.push(`  Proposito: ${proc.proposito}`);
      if (proc.alcance) partes.push(`  Alcance: ${proc.alcance}`);

      const pasosProc = pasos.filter((p: any) => p.procedimiento_codigo === proc.codigo && p.descripcion);
      for (const paso of pasosProc) {
        partes.push(`  - ${paso.descripcion}`);
      }

      const politicasProc = politicas.filter((p: any) => p.procedimiento_codigo === proc.codigo && p.politica);
      for (const pol of politicasProc) {
        partes.push(`  * Politica: ${pol.politica}`);
      }
    }

    if (partes.length === 0) return null;

    return {
      procedimientos,
      pasos: pasos.filter((p: any) => p?.descripcion),
      politicas: politicas.filter((p: any) => p?.politica),
      textoCompleto: partes.join('\n'),
      totalProcedimientos: procedimientos.length,
    };
  } catch {
    return null;
  }
}
