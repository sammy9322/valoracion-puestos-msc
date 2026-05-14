import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

export interface CargoParsed {
  nombre: string;
  funciones: string[];
  requisitos: {
    academicos: string;
    experiencia: string;
    supervision: string;
    legales: string;
  };
  conocimientos: string[];
  condiciones: string[];
  cargo_id?: string | null;
  nombre_oficial?: string;
  vinculado?: boolean;
  original_pdf_data?: any;
}

export interface ClaseParsed {
  nombre_clase: string;
  naturaleza: string;
  estrato: string;
  cargos: CargoParsed[];
}

export interface ManualParseResult {
  version: number;
  fecha_importacion: string;
  clases: ClaseParsed[];
  resumen: {
    total_clases: number;
    total_cargos: number;
    estratos: string[];
    vinculados?: number;
  };
}

const ESTRATOS = [
  'Estrato Operativo',
  'Estrato Administrativo',
  'Estrato Policial',
  'Estrato Técnico',
  'Estrato Profesional',
  'Estrato Ejecutivo'
];

const KEYWORD_AREAS: Record<string, string> = {
  'contabilidad': 'CON', 'tesoreria': 'TES', 'presupuesto': 'PRE',
  'recursos humanos': 'DRH', 'personal': 'DRH', 'planillas': 'DRH',
  'informatica': 'TIC', 'sistemas': 'TIC', 'tecnologias': 'TIC',
  'auditoria': 'DCI', 'control interno': 'DCI',
  'legal': 'AJU', 'juridico': 'AJU', 'abogado': 'AJU',
  'secretaria': 'SEC', 'alcaldia': 'ALC', 'consejo': 'SEC',
  'servicios': 'SEM', 'mantenimiento': 'SEM', 'aseo': 'SEM', 'mercado': 'SEM', 'maquinaria': 'SEM',
  'obras': 'UTG', 'vias': 'UTG', 'vial': 'UTG', 'gestion vial': 'UTG', 'infraestructura': 'UTG',
  'acueducto': 'ACU', 'agua': 'ACU', 'hidrometro': 'ACU', 'lector': 'ACU',
  'catastro': 'CAT', 'valoracion': 'CAT',
  'ambiental': 'GAM', 'gestion ambiental': 'GAM', 'residuos': 'GAM',
  'patentes': 'TRI', 'tributacion': 'TRI', 'cobros': 'TRI',
  'planificacion': 'PLA', 'transito': 'PTR', 'parquimetros': 'TRI',
  'seguridad': 'SEG', 'policia': 'SEG', 'vigilante': 'SEG',
  'cultura': 'DCC', 'deporte': 'DCC', 'biblioteca': 'DCC',
  'cementerio': 'CEM', 'conserje': 'SEM', 'chofer': 'SEM', 'mensajero': 'SEC'
};

function getAreaFromCargo(nombreCargo: string): string {
  const lower = nombreCargo.toLowerCase();
  for (const [keyword, area] of Object.entries(KEYWORD_AREAS)) {
    if (lower.includes(keyword)) return area;
  }
  return '';
}

const VERBOS_ACCION = [
  'Asistir', 'Participar', 'Velar', 'Coordinar', 'Realizar', 'Preparar', 'Controlar',
  'Ejecutar', 'Desarrollar', 'Elaborar', 'Confeccionar', 'Supervisar', 'Revisar',
  'Apoyar', 'Colaborar', 'Brindar', 'Atender', 'Gestionar', 'Organizar', 'Dirigir',
  'Planear', 'Analizar', 'Tramitar', 'Recibir', 'Enviar', 'Custodiar', 'Informar',
  'Prestar', 'Garantizar', 'Implementar', 'Mejorar', 'Efectuar', 'Validar'
];

function cleanFunctions(text: string): string[] {
  if (!text) return [];
  
  let flow = text.replace(/[\n\r]+/g, ' ')
                 .replace(/\.{3,}/g, ' ')
                 .replace(/Página\s+\d+/gi, '')
                 .replace(/\s+/g, ' ')
                 .trim();

  let markedText = flow;
  for (const verbo of VERBOS_ACCION) {
    const regex = new RegExp(`(\\.\\s+)(${verbo}\\b)`, 'g');
    markedText = markedText.replace(regex, `$1[BREAK]$2`);
  }

  markedText = markedText.replace(/[•\-\*]/g, '[BREAK]');

  const blocks = markedText.split('[BREAK]');
  const result: string[] = [];

  for (let block of blocks) {
    const cleaned = finalizeSentence(block);
    if (cleaned.length > 15) {
      result.push(cleaned);
    }
  }

  return result;
}

function finalizeSentence(s: string): string {
  if (!s) return "";
  
  let cleaned = s.replace(/\s+/g, ' ')
                 .replace(/\s*\.\s*\./g, '.')
                 .replace(/\.{2,}/g, '.')
                 .replace(/\.\s+\./g, '.')
                 .replace(/^[^a-zA-ZÁÉÍÓÚ]+/, '')
                 .trim();
  
  if (cleaned.length === 0) return "";
  
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  cleaned = cleaned.replace(/[.\s,;]+$/, ''); 
  cleaned += ".";
  
  return cleaned;
}

function extractBetween(text: string, start: string, end: string): string {
  const startIdx = text.indexOf(start);
  if (startIdx === -1) return '';
  const endIdx = text.indexOf(end, startIdx + start.length);
  if (endIdx === -1) return text.substring(startIdx + start.length).trim();
  return text.substring(startIdx + start.length, endIdx).trim();
}

export async function parsePDF(buffer: Buffer): Promise<ManualParseResult> {
  try {
    const data = await pdf(buffer);
    return parseText(data.text || '');
  } catch (error: any) {
    console.error('Error parsing PDF:', error?.message || error);
    throw new Error('Error al leer el archivo PDF. Asegúrese de que no esté dañado.');
  }
}

export async function parseDOCX(buffer: Buffer): Promise<ManualParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return parseText(result.value);
  } catch (error: any) {
    console.error('Error parsing DOCX:', error?.message || error);
    throw new Error('Error al leer el archivo DOCX. Asegúrese de que no esté dañado.');
  }
}

export async function parseManual(file: Buffer, filename: string): Promise<ManualParseResult> {
  const ext = filename.toLowerCase().split('.').pop();
  let text = '';
  if (ext === 'pdf') {
    const data = await pdf(file);
    text = data.text;
  } else if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer: file });
    text = result.value;
  } else throw new Error(`Formato no soportado: ${ext}. Use PDF o DOCX.`);
  
  let officialCargos: any[] = [];
  try {
    const { data } = await supabase.from('v_catalogo_puestos').select('*');
    if (data) officialCargos = data;
  } catch (err) {
    console.error('Error al obtener catálogo oficial de Supabase:', err);
  }

  const manualResult = parseText(text, officialCargos);

  // 1. Vinculación Heurística Inicial
  if (officialCargos.length > 0) {
      const clean = (s: any) => (s ? String(s) : '').toLowerCase().trim().replace(/\s+/g, ' ');
      
      const linkedCargoNames: Set<string> = new Set();
      const linkedClaseNames: Set<string> = new Set();

      manualResult.clases.forEach(clase => {
        clase.cargos.forEach(cargo => {
          const target = clean(cargo.nombre);
          const claseTarget = clean(clase.nombre_clase);
          
          const seqMatch = claseTarget.match(/\d+/);
          const seqManual = seqMatch ? seqMatch[0] : null;

          const match = officialCargos.find((oc: any) => {
            const cargoMatch = clean(oc.cargo) === target || target.includes(clean(oc.cargo)) || clean(oc.cargo).includes(target);
            if (!cargoMatch) return false;

            if (seqManual && oc.clase) {
              const dbSeqMatch = clean(oc.clase).match(/\d+/);
              const dbSeq = dbSeqMatch ? dbSeqMatch[0] : null;
              if (dbSeq && seqManual !== dbSeq) return false;
            }
            return true;
          });
          
          if (match) {
            cargo.cargo_id = match.cargo_id;
            cargo.nombre_oficial = match.cargo;
            cargo.vinculado = true;
            linkedCargoNames.add(match.cargo);
            linkedClaseNames.add(match.clase);
          } else {
            cargo.vinculado = false;
          }
        });
      });

      // 2. Enriquecimiento Oficial (Senior Architect / Database Architect)
      // Extraemos los detalles técnicos directamente de Supabase para los vinculados
      if (linkedCargoNames.size > 0) {
        try {
          console.log(`[Enriquecedor] Obteniendo detalles oficiales para ${linkedCargoNames.size} cargos...`);
          
          // Fetch masivo de funciones y requisitos
          const [resCargos, resClases] = await Promise.all([
            supabase.from('cargos_puesto').select('nombre, funciones').in('nombre', Array.from(linkedCargoNames)),
            supabase.from('clases_puesto').select('nombre, naturaleza, estrato, detalle').in('nombre', Array.from(linkedClaseNames))
          ]);

          const mapCargos = new Map(resCargos.data?.map(c => [clean(c.nombre), c]) || []);
          const mapClases = new Map(resClases.data?.map(c => [clean(c.nombre), c]) || []);

          manualResult.clases.forEach(clase => {
            const officialClase = mapClases.get(clean(clase.nombre_clase));
            
            clase.cargos.forEach(cargo => {
              if (cargo.vinculado && cargo.nombre_oficial) {
                const officialCargo = mapCargos.get(clean(cargo.nombre_oficial));
                
                // Backup de datos del PDF para Auditoría (Comparación futura)
                cargo.original_pdf_data = {
                  funciones: [...cargo.funciones],
                  requisitos: { ...cargo.requisitos }
                };

                // Sustitución por Fuente de Verdad (Supabase)
                if (officialCargo?.funciones) {
                  cargo.funciones = Array.isArray(officialCargo.funciones) 
                    ? officialCargo.funciones 
                    : [officialCargo.funciones];
                }

                if (officialClase) {
                  const det = officialClase.detalle || {};
                  const req = det.requisitos_minimos || {};
                  
                  cargo.requisitos = {
                    academicos: req.academicos || cargo.requisitos.academicos,
                    experiencia: req.experiencia_laboral || cargo.requisitos.experiencia,
                    supervision: req.experiencia_supervision || cargo.requisitos.supervision,
                    legales: req.legales || cargo.requisitos.legales
                  };

                  cargo.conocimientos = det.conocimientos_deseables || [];
                  cargo.condiciones = det.condiciones_personales || [];
                  
                  // Forzar Estrato desde Supabase (Punto 2 del requerimiento)
                  if (officialClase.estrato) {
                    (clase as any).estrato = officialClase.estrato;
                  }
                }
              }
            });
          });
          console.log('[Enriquecedor] Sincronización con Supabase completada con éxito.');
        } catch (err) {
          console.error('[Enriquecedor] Error crítico en sincronización masiva:', err);
        }
      }

      manualResult.resumen.vinculados = manualResult.clases.reduce((acc, c) => 
        acc + c.cargos.filter(ca => ca.vinculado).length, 0);
    }

  return manualResult;
}

function parseText(text: string, officialCargos: any[] = []): ManualParseResult {
  const cleanedLines = text.split(/\n/).map(line => {
    if (/\.{3,}\s*\d+\s*$/.test(line)) return '';
    if (/^Página\s*\d+/i.test(line.trim())) return '';
    if (/^\s*\d+\s*$/.test(line.trim())) return '';
    return line;
  });
  
  const cleanText = cleanedLines.join('\n');
  const estratoRegex = /Estrato\s+(Operativo|Administrativo|Policial|T[eé]cnico|Profesional|Ejecutivo)/gi;
  const estratoMatches = [...cleanText.matchAll(estratoRegex)];
  const estratoGenericActivities: {[key: string]: string[]} = {};
  
  for (let i = 0; i < estratoMatches.length; i++) {
    const estratoName = estratoMatches[i][1].trim().toLowerCase();
    const start = estratoMatches[i].index! + estratoMatches[i][0].length;
    const nextMatch = i + 1 < estratoMatches.length ? estratoMatches[i+1].index! : cleanText.length;
    const estratoBlock = cleanText.substring(start, nextMatch);
    
    const genericMatch = estratoBlock.match(/Actividades\s+gen[eé]ricas\s+del\s+grupo[:\s]*([\s\S]*?)(?=Nombre de la clase|$)/i);
    if (genericMatch) {
      estratoGenericActivities[estratoName] = cleanFunctions(genericMatch[1]);
    }
  }

  const claseRegex = /Nombre de la clase:\s*([A-Za-z0-9áéíóúñÁÉÍÓÚÑ ]+)/gim;
  const claseMatches = [...cleanText.matchAll(claseRegex)];
  const clases: ClaseParsed[] = [];
  const estratosEncontrados = new Set<string>();

  for (let i = 0; i < claseMatches.length; i++) {
    const nombreClase = claseMatches[i][1].trim().replace(/\s+/g, ' ');
    if (nombreClase.length < 3) continue;
    
    const startIdx = claseMatches[i].index! + claseMatches[i][0].length;
    const endIdx = i + 1 < claseMatches.length ? claseMatches[i+1].index! : cleanText.length;
    const claseBlock = cleanText.substring(startIdx, endIdx);

    let currentEstrato = "Operativo";
    for (const match of estratoMatches) {
        if (match.index! < claseMatches[i].index!) {
            currentEstrato = match[1].trim();
        }
    }
    estratosEncontrados.add(currentEstrato);

    const naturalezaMatch = claseBlock.match(/Naturaleza de la clase[:\s]*([\s\S]*?)(?=Cargos contenidos|Funciones|Requisitos|$)/i);
    const naturaleza = naturalezaMatch ? naturalezaMatch[1].trim().replace(/\s+/g, ' ') : '';
    
    const cargosMatch = claseBlock.match(/Cargos\s+contenidos[:\s]*([\s\S]*?)(?=(?:^|\n)\s*(?:Funciones|Actividades)|(?:^|\n)\s*Requisitos|$)/i);
    const cargosRaw = cargosMatch ? cargosMatch[1] : '';
    let nombresCargosRaw: string[] = [];
    
    cargosRaw.split(/\n/).forEach(l => {
      let line = l.trim().replace(/\s+/g, ' ');
      
      // FILTRO ANTI-RUIDO: Eliminar basura administrativa del PDF
      const esBasura = 
        line.length < 3 || 
        line.length > 90 ||
        /acta|art[ií]culo|sesi[oó]n|p[aá]gina|manual|acuerdo|N[º°\.]|fecha|\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(line) ||
        /\d{4}\)/.test(line) || // Ej: "2012)"
        /^\d+\)?$/.test(line) || // Ej: "54)"
        /^[\d\.\s\-\,]+$/.test(line);

      if (!esBasura) {
        line = line.replace(/\([^)]+\)/g, '').trim(); // Eliminar paréntesis (notas)
        line = line.replace(/^[-•*]\s*/, '').trim(); // Eliminar viñetas
        if (line.length > 2 && !/^(Actividades|Funciones|Requisitos|Naturaleza)/i.test(line)) {
           if (!nombresCargosRaw.includes(line)) nombresCargosRaw.push(line);
        }
      }
    });
    
    // Inyección dinámica basada en el catálogo oficial de Supabase (Radar Heurístico)
    if (officialCargos && officialCargos.length > 0) {
      officialCargos.forEach(oc => {
        const cargoOficial = oc.cargo.trim();
        if (!nombresCargosRaw.includes(cargoOficial)) {
          const safeName = cargoOficial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?:^|\\n)\\s*${safeName}\\s*(?:\\n|$)`, 'i');
          if (regex.test(claseBlock)) {
             nombresCargosRaw.push(cargoOficial);
          }
        }
      });
    }

    if (nombresCargosRaw.length === 0) nombresCargosRaw = [nombreClase];

    const genericFunctions = estratoGenericActivities[currentEstrato.toLowerCase()] || [];
    const startSearchIdx = cargosMatch ? cargosMatch.index! + cargosMatch[0].length : 0;

    const cargos: CargoParsed[] = nombresCargosRaw.map((nombreOriginal, idx) => {
      const safeCargoName = nombreOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let cargoIdx = claseBlock.substring(startSearchIdx).search(new RegExp(`(?:^|\\n)\\s*${safeCargoName}\\s*(?:\\n|$)`, 'i'));
      if (cargoIdx !== -1) cargoIdx += startSearchIdx;
      else cargoIdx = claseBlock.indexOf(nombreOriginal, startSearchIdx);

      let funcionesEspecficasRaw = "";
      if (cargoIdx !== -1) {
          let endIdx = claseBlock.length;
          
          for (let i = 0; i < nombresCargosRaw.length; i++) {
              if (i === idx) continue;
              const otherIdx = claseBlock.indexOf(nombresCargosRaw[i], cargoIdx + nombreOriginal.length);
              if (otherIdx !== -1 && otherIdx < endIdx) {
                  endIdx = otherIdx;
              }
          }
          
          const reqIdx = claseBlock.search(/(?:^|\n)\s*Requisitos\s+M[íi]nimos/i);
          if (reqIdx !== -1 && reqIdx > cargoIdx && reqIdx < endIdx) {
              endIdx = reqIdx;
          }

          funcionesEspecficasRaw = claseBlock.substring(cargoIdx + nombreOriginal.length, endIdx).trim();
      }

      let parsedFunciones = cleanFunctions(funcionesEspecficasRaw);
      parsedFunciones = parsedFunciones.filter(f => f.length > 15 && !f.toLowerCase().includes('reglamento del estatuto'));
      
      let finalFunciones = [...parsedFunciones];
      const genericFiltered = genericFunctions.filter(f => f.length > 15 && !f.toLowerCase().includes('reglamento del estatuto'));
      
      if (finalFunciones.length === 0) {
          finalFunciones = genericFiltered;
      } else {
          for (const gf of genericFiltered) {
              if (!finalFunciones.includes(gf)) {
                  finalFunciones.push(gf);
              }
          }
      }
      const requisitosMatch = claseBlock.match(/Requisitos Mínimos[\s\S]*?(?=Conocimientos|$)/i);
      const reqRaw = requisitosMatch ? requisitosMatch[0] : '';
      
      const conocimientosMatch = claseBlock.match(/Conocimientos\s+deseables[\s\S]*?(?=Condiciones|Nombre de la clase|$)/i);
      const condicionesMatch = claseBlock.match(/Condiciones\s+personales\s+deseables[\s\S]*?(?=Nombre de la clase|$)/i);
      
      return {
        nombre: nombreOriginal.replace(/[.:]$/, '').trim(),
        funciones: finalFunciones,
        requisitos: {
          academicos: extractBetween(reqRaw, 'Académicos', 'Experiencia'),
          experiencia: extractBetween(reqRaw, 'Experiencia laboral', 'Experiencia en supervisión'),
          supervision: extractBetween(reqRaw, 'Experiencia en supervisión', 'Legales'),
          legales: extractBetween(reqRaw, 'Legales', '')
        },
        conocimientos: conocimientosMatch ? cleanFunctions(conocimientosMatch[0]) : [],
        condiciones: condicionesMatch ? cleanFunctions(condicionesMatch[0]) : []
      };
    });
    
    clases.push({ nombre_clase: nombreClase, naturaleza, estrato: currentEstrato, cargos });
  }
  
  return {
    version: Date.now(),
    fecha_importacion: new Date().toISOString(),
    clases,
    resumen: {
      total_clases: clases.length,
      total_cargos: clases.reduce((s, c) => s + c.cargos.length, 0),
      estratos: Array.from(estratosEncontrados)
    }
  };
}

export function mapCargoToArea(cargo: CargoParsed): string {
  return getAreaFromCargo(cargo.nombre);
}