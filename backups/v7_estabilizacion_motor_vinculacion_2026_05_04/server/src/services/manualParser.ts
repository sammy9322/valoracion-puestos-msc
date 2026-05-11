const pdf = require('pdf-parse');
const mammoth = require('mammoth');

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
  'servicios': 'SEM', 'mantenimiento': 'SEM', 'aseo': 'SEM',
  'obras': 'UTG', 'vial': 'UTG', 'gestion vial': 'UTG', 'infraestructura': 'UTG',
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

function detectEstrato(text: string): string {
  for (const estrato of ESTRATOS) {
    if (text.includes(estrato)) return estrato.replace('Estrato ', '');
  }
  return 'Operativo';
}

function extractBetween(text: string, start: string, end: string): string {
  const startIdx = text.indexOf(start);
  if (startIdx === -1) return '';
  const endIdx = text.indexOf(end, startIdx + start.length);
  if (endIdx === -1) return text.substring(startIdx + start.length).trim();
  return text.substring(startIdx + start.length, endIdx).trim();
}

function cleanFunctions(text: string): string[] {
  if (!text) return [];
  return text
    .split(/[\n\r]+/)
    .map(line => line.replace(/^[\s•\-\*\d.]+/, '').trim())
    .filter(line => line.length > 5 && !/^(página|articulo|acta|sesión)/i.test(line));
}

function extractBetweenDelimiters(text: string, start: string, end: string): string {
  const startIdx = text.indexOf(start);
  if (startIdx === -1) return '';
  const searchFrom = startIdx + start.length;
  const endIdx = text.indexOf(end, searchFrom);
  if (endIdx === -1) return text.substring(searchFrom).trim();
  return text.substring(searchFrom, endIdx).trim();
}

function parseCargo(text: string, cargoNombre: string, genericFunctions: string[]): CargoParsed {
  const lines = text.split('\n');
  let capture = false;
  let result: string[] = [];
  
  for (const line of lines) {
    if (line.includes(cargoNombre) && line.match(/^[A-Z]/)) {
      capture = true;
      continue;
    }
    if (capture) {
      if (line.match(/^[A-Z][a-z]+\s+Municipal/) || 
          line.match(/^Nombre de la clase/) ||
          line.match(/^Requisitos Mínimos/) ||
          line.match(/^Conocimientos/) ||
          line.match(/^Condiciones/) ||
          line.match(/^Estrato/)) {
        break;
      }
      result.push(line);
    }
  }
  
  const cargoBlock = result.join('\n').trim();
  
  const funcionesMatch = cargoBlock.match(/funciones específicas por cargo[\s\S]*?(?=Requisitos)/i);
  const funcionesRaw = funcionesMatch ? funcionesMatch[0].replace(/funciones específicas por cargo/i, '').trim() : '';
  
  let funciones = cleanFunctions(funcionesRaw);
  
  if (funciones.length === 0 && genericFunctions.length > 0) {
    funciones = [...genericFunctions];
  }
  
  const requisitosMatch = cargoBlock.match(/Requisitos Mínimos[\s\S]*?(?=Conocimientos)/i);
  const requisitosRaw = requisitosMatch ? requisitosMatch[0] : '';
  
  const academicosMatch = requisitosRaw.match(/Académicos[\s\S]*?(?=Experiencia)/i);
  const experienciaMatch = requisitosRaw.match(/Experiencia laboral[\s\S]*?(?=Experiencia en supervisión)/i);
  const supervisionMatch = requisitosRaw.match(/Experiencia en supervisión[\s\S]*?(?=Legales)/i);
  const legalesMatch = requisitosRaw.match(/Legales[\s\S]*$/i);
  
  const conocimientosMatch = cargoBlock.match(/Conocimientos deseables[\s\S]*?(?=Condiciones)/i);
  const conocimientosRaw = conocimientosMatch ? conocimientosMatch[0].replace(/Conocimientos deseables/i, '').trim() : '';
  const conocimientos = cleanFunctions(conocimientosRaw);
  
  const condicionesMatch = cargoBlock.match(/Condiciones personales deseables[\s\S]*$/i);
  const condicionesRaw = condicionesMatch ? condicionesMatch[0].replace(/Condiciones personales deseables/i, '').trim() : '';
  const condiciones = cleanFunctions(condicionesRaw);
  
  return {
    nombre: cargoNombre,
    funciones,
    requisitos: {
      academicos: academicosMatch ? extractBetween(academicosMatch[0], 'Académicos', 'Experiencia').trim() : '',
      experiencia: experienciaMatch ? extractBetween(experienciaMatch[0], 'Experiencia laboral', 'Experiencia').trim() : '',
      supervision: supervisionMatch ? extractBetween(supervisionMatch[0], 'Experiencia en supervisión', 'Legales').trim() : '',
      legales: legalesMatch ? extractBetween(legalesMatch[0], 'Legales', '').trim() : ''
    },
    conocimientos,
    condiciones
  };
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
  if (ext === 'pdf') return parsePDF(file);
  else if (ext === 'docx') return parseDOCX(file);
  else throw new Error(`Formato no soportado: ${ext}. Use PDF o DOCX.`);
}

function parseText(text: string): ManualParseResult {
  console.log('[DEBUG] Input text length:', text.length);
  
  // Step 1: Pre-process lines (clean TOC and headers)
  const cleanedLines = text.split(/\n/).map(line => {
    if (/\.{3,}\s*\d+\s*$/.test(line)) return '';
    if (/^Página\s*\d+/i.test(line.trim())) return '';
    if (/^\s*\d+\s*$/.test(line.trim())) return '';
    return line;
  });
  
  const cleanText = cleanedLines.join('\n');
  console.log('[DEBUG] Clean text length:', cleanText.length);
  
  // Step 1.5: Identify Group Generic Activities (Estratos)
  const estratoRegex = /Estrato\s+([A-Za-zÁÉÍÓÚÑ ]+)(?:\n|$)/gi;
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

  // Step 2: Find all classes
  const claseRegex = /Nombre de la clase:\s*([A-Za-z0-9áéíóúñÁÉÍÓÚÑ ]+)/gim;
  const claseMatches = [...cleanText.matchAll(claseRegex)];
  console.log('[DEBUG] Clases encontradas:', claseMatches.length);
  
  const clases: ClaseParsed[] = [];
  const estratosEncontrados = new Set<string>();

  for (let i = 0; i < claseMatches.length; i++) {
    const nombreClase = claseMatches[i][1].trim().replace(/\s+/g, ' ');
    if (nombreClase.length < 3 || nombreClase.length > 100) continue;
    
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
    
    const cargosMatch = claseBlock.match(/Cargos\s+contenidos[:\s]*([\s\S]*?)(?=(?:^|\n)\s*(?:Funciones|Actividades)\s*(?:espec[ií]ficas|generales)|(?:^|\n)\s*Tareas|(?:^|\n)\s*Requisitos|$)/i);
    const cargosRaw = cargosMatch ? cargosMatch[1] : '';
    let nombresCargosRaw: string[] = [];
    
    // Extracción limpia de cargos sin filtros agresivos que causen pérdida de datos
    cargosRaw.split(/\n/).forEach(l => {
      let line = l.trim();
      if (line.length > 2) {
        // Ignorar líneas que son solo números o metadatos obvios si es necesario, 
        // pero priorizar no perder puestos.
        const esMeta = /^(acta|art[ií]culo|sesi[oó]n|página|manual)/i.test(line);
        if (!esMeta) {
          const prev = nombresCargosRaw[nombresCargosRaw.length - 1] || '';
          const openParens = (prev.match(/\(/g) || []).length;
          const closeParens = (prev.match(/\)/g) || []).length;
          
          if (nombresCargosRaw.length > 0 && (openParens > closeParens || /^[a-z]/.test(line))) {
             nombresCargosRaw[nombresCargosRaw.length - 1] += ' ' + line;
          } else {
             nombresCargosRaw.push(line);
          }
        }
      }
    });
    
    if (nombresCargosRaw.length === 0) nombresCargosRaw = [nombreClase];

    const cleanCargoName = (n: string) => n.replace(/\s*\(.*?\)\s*/g, '').replace(/[.:]$/, '').trim();
    const nombresCargosClean = nombresCargosRaw.map(cleanCargoName);

    // Find functions block with anchored delimiters
    const funcionesBlockMatch = claseBlock.match(/(?:^|\n)\s*(?:Funciones\s+espec[ií]ficas(?:\s*por\s*cargo)?|Funciones|Actividades\s+generales|Descripci[oó]n\s+de\s+actividades)[:\s]*\n([\s\S]*?)(?=(?:^|\n)\s*(?:Requisitos|Conocimientos|Condiciones|Nombre de la clase)|$)/i);
    const funcionesRaw = funcionesBlockMatch ? funcionesBlockMatch[1] : "";

    const genericFunctions = estratoGenericActivities[currentEstrato.toLowerCase()] || [];

    const cargos: CargoParsed[] = nombresCargosRaw.map((nombreOriginal, idx) => {
      const nombreLimpio = nombresCargosClean[idx];
      let cargoFunctions = [...genericFunctions];
      
      if (funcionesRaw) {
        const nextCargos = nombresCargosClean.slice(idx + 1);
        const delimiter = nextCargos.length > 0 
          ? `(?=${nextCargos.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')).join('|')}|(?:^|\\n)\\s*Requisitos|$)`
          : '(?=(?:^|\\n)\\s*Requisitos|$)';
        
        const escapedNombre = nombreLimpio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        const cargoRegex = new RegExp(`${escapedNombre}[.:\\s\\n]*([\\s\\S]*?)${delimiter}`, 'i');
        
        const match = funcionesRaw.match(cargoRegex);
        
        if (match && match[1]) {
          const specificFunctions = cleanFunctions(match[1]);
          if (specificFunctions.length > 0) {
            cargoFunctions = specificFunctions;
          }
        }
      }
      
      const requisitosMatch = claseBlock.match(/Requisitos Mínimos[\s\S]*?(?=Conocimientos|$)/i);
      const requisitosRaw = requisitosMatch ? requisitosMatch[0] : '';
      
      const academicosMatch = requisitosRaw.match(/Académicos[\s\S]*?(?=Experiencia)/i);
      const experienciaMatch = requisitosRaw.match(/Experiencia laboral[\s\S]*?(?=Experiencia en supervisión)/i);
      const supervisionMatch = requisitosRaw.match(/Experiencia en supervisión[\s\S]*?(?=Legales)/i);
      const legalesMatch = requisitosRaw.match(/Legales[\s\S]*$/i);
      
      const conocimientosMatch = claseBlock.match(/Conocimientos\s+deseables[\s\S]*?(?=Condiciones|Nombre de la clase|$)/i);
      const conocimientos = conocimientosMatch ? cleanFunctions(conocimientosMatch[0].replace(/Conocimientos\s+deseables/i, '')) : [];
      
      const condicionesMatch = claseBlock.match(/Condiciones\s+personales\s+deseables[\s\S]*?(?=Nombre de la clase|$)/i);
      const condiciones = condicionesMatch ? cleanFunctions(condicionesMatch[0].replace(/Condiciones\s+personales\s+deseables/i, '')) : [];
      
      return {
        nombre: nombreOriginal,
        funciones: cargoFunctions,
        requisitos: {
          academicos: academicosMatch ? extractBetween(academicosMatch[0], 'Académicos', 'Experiencia').trim() : '',
          experiencia: experienciaMatch ? extractBetween(experienciaMatch[0], 'Experiencia laboral', 'Experiencia').trim() : '',
          supervision: supervisionMatch ? extractBetween(supervisionMatch[0], 'Experiencia en supervisión', 'Legales').trim() : '',
          legales: legalesMatch ? extractBetween(legalesMatch[0], 'Legales', '').trim() : ''
        },
        conocimientos,
        condiciones
      };
    });
    
    if (cargos.length > 0) {
      clases.push({
        nombre_clase: nombreClase,
        naturaleza,
        estrato: currentEstrato,
        cargos
      });
    }
  }
  
  const totalCargos = clases.reduce((sum, c) => sum + c.cargos.length, 0);
  
  return {
    version: Date.now(),
    fecha_importacion: new Date().toISOString(),
    clases,
    resumen: {
      total_clases: clases.length,
      total_cargos: totalCargos,
      estratos: Array.from(estratosEncontrados)
    }
  };
}

export function mapCargoToArea(cargo: CargoParsed): string {
  return getAreaFromCargo(cargo.nombre);
}