/**
 * Diccionario Determinista de Alias de Puestos
 * 
 * Resuelve la discrepancia entre el nombre oficial del puesto en la ficha
 * y el nombre registrado como "Responsable" en los procedimientos de Supabase.
 * 
 * Ejemplo: La ficha dice "Encargado de Control Interno", pero los procedimientos
 * registran al responsable como "Coordinador de Control Interno".
 * 
 * IMPORTANTE: Este archivo es la ÚNICA fuente de verdad para alias.
 * Cualquier nuevo alias debe agregarse aquí y documentarse con su justificación.
 * 
 * @see CHECKPOINT-2026-05-27.md — Sección 1.3 "Diagnóstico de Procedimientos"
 */

export const JOB_ALIASES: Record<string, string[]> = {
  // Justificación: El procedimiento usa "Coordinador" y "Asistente" pero la ficha dice "Encargado"
  "Encargado de Control Interno": [
    "Coordinador de Control Interno",
    "Asistente de Control Interno",
  ],
  // Justificación: Los pasos de procedimiento registran "N/A" como responsable genérico del área
  "Encargado de Salud Ocupacional": [
    "N/A",
  ],
};

/**
 * Obtiene todos los nombres válidos para un puesto dado,
 * incluyendo su nombre original, el alias SIM, y los alias del diccionario.
 * Retorna un Set en lowercase para comparación eficiente.
 */
export function buildAliasSet(nombrePuesto: string, nombreSim?: string): Set<string> {
  const aliases = new Set<string>();

  if (nombrePuesto) {
    aliases.add(nombrePuesto.toLowerCase());
  }
  if (nombreSim) {
    aliases.add(nombreSim.toLowerCase());
  }

  const extraAliases = JOB_ALIASES[nombrePuesto] || [];
  for (const alias of extraAliases) {
    if (alias && alias !== 'N/A') {
      aliases.add(alias.toLowerCase());
    }
  }

  return aliases;
}
