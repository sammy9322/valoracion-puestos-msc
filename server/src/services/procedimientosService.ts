import { createClient } from '@supabase/supabase-js';
import { buildAliasSet, JOB_ALIASES } from '../config/jobAliases';

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
  if (!db || !puesto?.nombre) return null;

  try {
    // 1. Obtener detalles del cargo oficial para recuperar su alias (nombre_sim) en Supabase
    const { data: cargoData }: any = await db
      .from('cargos_puesto')
      .select('nombre_sim')
      .eq('nombre', puesto.nombre)
      .maybeSingle();

    const nombreSim = cargoData?.nombre_sim || puesto.nombre;
    console.log(`[Procedimientos] Resolviendo puesto "${puesto.nombre}" con alias SIM: "${nombreSim}"`);

    // Construir el set consolidado de aliases para este puesto
    const aliases = buildAliasSet(puesto.nombre, nombreSim);
    const dictAliases = JOB_ALIASES[puesto.nombre];
    if (dictAliases && dictAliases.length > 0) {
      console.log(`[Procedimientos] 📋 Alias del diccionario activados para "${puesto.nombre}": [${dictAliases.join(', ')}]`);
    }
    console.log(`[Procedimientos] Set de búsqueda consolidado: [${Array.from(aliases).join(', ')}]`);

    // 2. Mapear de forma dinámica el nombre del departamento/área con su código de Supabase (ej: "Control Interno" -> "DCI")
    const areaTarget = puesto.area || '';
    let deptoCodigo = '';
    
    const { data: depto }: any = await db
      .from('departamentos')
      .select('codigo')
      .eq('nombre', areaTarget)
      .maybeSingle();

    if (depto?.codigo) {
      deptoCodigo = depto.codigo;
    } else {
      const { data: deptoSim }: any = await db
        .from('departamentos')
        .select('codigo')
        .eq('nombre_sim', areaTarget.toUpperCase())
        .maybeSingle();
      deptoCodigo = deptoSim?.codigo || areaTarget;
    }
    console.log(`[Procedimientos] Traduciendo área "${areaTarget}" a código de departamento: "${deptoCodigo}"`);

    // 3. Consultar los procedimientos asignados a dicho departamento
    const { data: procedimientos, error: procError }: any = await db
      .from('procedimientos')
      .select('codigo, nombre, proposito, alcance')
      .eq('departamento', deptoCodigo)
      .order('nombre');

    if (procError || !procedimientos?.length) {
      console.log(`[Procedimientos] No se encontraron procedimientos para el departamento: "${deptoCodigo}"`);
      return null;
    }

    const codigos: string[] = procedimientos.map((p: any) => p.codigo);

    // 4. Recuperar de forma masiva los pasos y las políticas
    const [pasosRes, politicasRes] = await Promise.allSettled([
      db.from('pasos_procedimiento')
        .select('descripcion, procedimiento_codigo, responsable, secuencia')
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
    const procsFiltrados: any[] = [];

    // 5. Construir el contexto inyectando marcadores de responsabilidad para el puesto evaluado
    for (const proc of procedimientos) {
      const pasosProc = pasos.filter((p: any) => p.procedimiento_codigo === proc.codigo && p.descripcion);
      
      // Filtrar procedimientos: solo nos interesan donde el puesto tenga alguna intervención
      // Se evalúa contra el set consolidado de aliases (nombre + SIM + diccionario)
      const isPositionInvolved = pasosProc.some((p: any) => {
        if (!p.responsable) return false;
        const respLower = p.responsable.toLowerCase();
        for (const alias of aliases) {
          if (respLower.includes(alias) || alias.includes(respLower)) {
            return true;
          }
        }
        return false;
      });

      // Si el puesto no tiene pasos asignados en este procedimiento, lo ignoramos para no saturar el contexto de la IA
      if (!isPositionInvolved) continue;

      procsFiltrados.push(proc);
      partes.push(`\nProcedimiento: ${proc.nombre} (${proc.codigo})`);
      if (proc.proposito) partes.push(`  Proposito: ${proc.proposito}`);
      if (proc.alcance) partes.push(`  Alcance: ${proc.alcance}`);

      for (const paso of pasosProc) {
        // Verificar si el puesto actual es responsable de este paso específico
        // Se evalúa contra el set consolidado de aliases
        let isResponsible = false;
        let matchedAlias = '';
        if (paso.responsable) {
          const respLower = paso.responsable.toLowerCase();
          for (const alias of aliases) {
            if (respLower.includes(alias) || alias.includes(respLower)) {
              isResponsible = true;
              // Log de auditoría: registrar qué alias produjo el match
              if (alias !== puesto.nombre.toLowerCase() && alias !== nombreSim.toLowerCase()) {
                matchedAlias = alias;
              }
              break;
            }
          }
        }

        const responsableTag = paso.responsable ? ` [Responsable: ${paso.responsable}]` : '';
        const actionTag = isResponsible ? ' (¡EL PUESTO EVALUADO REALIZA ESTA TAREA!)' : '';
        partes.push(`  - Paso ${paso.secuencia}${responsableTag}${actionTag}: ${paso.descripcion}`);
      }

      const politicasProc = politicas.filter((p: any) => p.procedimiento_codigo === proc.codigo && p.politica);
      for (const pol of politicasProc) {
        partes.push(`  * Politica: ${pol.politica}`);
      }
    }

    if (partes.length === 0) {
      console.log(`[Procedimientos] El puesto "${puesto.nombre}" no participa activamente en ninguno de los procedimientos de "${deptoCodigo}"`);
      return null;
    }

    // Log de auditoría: resumen de la vinculación
    const usedDictAlias = dictAliases && dictAliases.length > 0;
    console.log(`[Procedimientos] ✅ Inyectados ${procsFiltrados.length} procedimientos con participación activa.${usedDictAlias ? ' (Match vía diccionario de alias)' : ''}`);

    return {
      procedimientos: procsFiltrados,
      pasos: pasos.filter((p: any) => p?.descripcion),
      politicas: politicas.filter((p: any) => p?.politica),
      textoCompleto: partes.join('\n'),
      totalProcedimientos: procsFiltrados.length,
    };
  } catch (error: any) {
    console.error('[Procedimientos] Error crítico en el enriquecimiento de procedimientos:', error?.message || error);
    return null;
  }
}
