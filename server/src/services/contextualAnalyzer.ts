import dotenv from 'dotenv';
dotenv.config();

export const FACTOR_NAMES: Record<string, string> = {
  dificultad: 'Dificultad de Funciones',
  supervision: 'Supervision Ejercida',
  responsabilidad: 'Responsabilidad',
  condiciones: 'Condiciones de Trabajo',
  error: 'Consecuencia del Error',
  requisitos: 'Requisitos'
};

export const CONTINUOUS_MAX: Record<string, number> = {
  dificultad: 200, supervision: 150, responsabilidad: 200,
  condiciones: 100, error: 150, requisitos: 200
};

export const POINTS_MAP: Record<string, number[]> = {
  dificultad: [0, 40, 80, 120, 160, 200],
  supervision: [0, 30, 60, 90, 120, 150],
  responsabilidad: [0, 40, 80, 120, 160, 200],
  condiciones: [0, 20, 40, 60, 80, 100],
  error: [0, 30, 60, 90, 120, 150],
  requisitos: [0, 40, 80, 120, 160, 200]
};

const GRADE_DESCRIPTIONS: Record<string, string[]> = {
  dificultad: [
    'Tareas simples y repetitivas, poca iniciativa',
    'Tareas variadas pero estandarizadas',
    'Requiere análisis y juicio para resolver problemas técnicos',
    'Alta complejidad, planificación y coordinación institucional',
    'Dirección estratégica y toma de decisiones críticas'
  ],
  supervision: [
    'No ejerce supervisión',
    'Supervisión ocasional de tareas simples',
    'Supervisión de grupo de trabajo operativo',
    'Jefatura de una unidad o departamento',
    'Dirección de área técnica o administrativa mayor'
  ],
  responsabilidad: [
    'Baja responsabilidad por valores o equipo',
    'Responsabilidad moderada por materiales y herramientas',
    'Custodia de información sensible o fondos fijos',
    'Responsabilidad por presupuestos o activos de alto valor',
    'Responsabilidad total por gestión de proceso clave'
  ],
  condiciones: [
    'Ambiente de oficina normal, riesgos mínimos',
    'Esfuerzo físico moderado o ambiente algo incómodo',
    'Exposición a condiciones climáticas o ruido constante',
    'Riesgo de accidentes laborales o manejo de químicos',
    'Condiciones de alta peligrosidad o insalubridad constante'
  ],
  error: [
    'Error fácil de detectar y corregir',
    'Error causa retrasos menores en el flujo de trabajo',
    'Error afecta a otros departamentos o al servicio al ciudadano',
    'Error causa pérdidas económicas o legales significativas',
    'Error compromete la estabilidad institucional o seguridad pública'
  ],
  requisitos: [
    'Educación básica o primaria',
    'Bachillerato en Educación Media o Técnico básico',
    'Diplomado o Técnico superior especializado',
    'Bachillerato Universitario o Licenciatura profesional',
    'Grado de Maestría o especialización avanzada requerida'
  ]
};

type VerbCat = 'operativo'|'ejecucion'|'analisis'|'planificacion'|'direccion';
type ObjType = 'simple'|'tecnico'|'estrategico'|'directivo';

interface VerbClass { cat: VerbCat; base: number }
interface Accion { verbo: string; verboNorm: string; objeto: string; oracion: string }
export interface TaggedAccion extends Accion {
  fuente: 'funciones' | 'procedimiento';
  procCodigo?: string;
  procNombre?: string;
}
interface RolProfile { nombre: string; baseDificultad: number; baseSupervision: number; baseResponsabilidad: number; baseCondiciones: number; baseError: number }
interface FactorResult { grado: number; puntos: number; justificacion: string }

export interface EvaluationSuggestion {
  dificultad: number; dificultad_just: string;
  supervision: number; supervision_just: string;
  responsabilidad: number; responsabilidad_just: string;
  condiciones: number; condiciones_just: string;
  error: number; error_just: string;
  requisitos: number; requisitos_just: string;
}

export interface FactorKeywordDetail {
  factor: string; keywords: string[]; procKeywords: string[]; grado: number;
}

export interface AIEvaluationResult {
  success: boolean;
  data: EvaluationSuggestion;
  totalPuntos: number;
  puesto_id: string;
  analisis_completo: boolean;
  motor: 'llm' | 'rule-based';
  procedimientosCount?: number;
  factorPoints?: Record<string, number>;
  buildVersion?: string;
  procContribution?: string[];
}

const VERB_LEXICON: Record<string, VerbClass> = {
  barrer:{cat:'operativo',base:1},limpiar:{cat:'operativo',base:1},cargar:{cat:'operativo',base:1},
  archivar:{cat:'operativo',base:1},ordenar:{cat:'operativo',base:1},copiar:{cat:'operativo',base:1},
  etiquetar:{cat:'operativo',base:1},fotocopiar:{cat:'operativo',base:1},doblar:{cat:'operativo',base:1},
  empacar:{cat:'operativo',base:1},
  operar:{cat:'ejecucion',base:2},tramitar:{cat:'ejecucion',base:2},llenar:{cat:'ejecucion',base:2},
  registrar:{cat:'ejecucion',base:2},recibir:{cat:'ejecucion',base:2},enviar:{cat:'ejecucion',base:2},
  atender:{cat:'ejecucion',base:2},asistir:{cat:'ejecucion',base:2},apoyar:{cat:'ejecucion',base:2},
  analizar:{cat:'analisis',base:3},auditar:{cat:'analisis',base:3},fiscalizar:{cat:'analisis',base:3},controlar:{cat:'analisis',base:3},vigilar:{cat:'analisis',base:3},evaluar:{cat:'analisis',base:3},diagnosticar:{cat:'analisis',base:3},
  inspeccionar:{cat:'analisis',base:3},revisar:{cat:'analisis',base:3},verificar:{cat:'analisis',base:3},
  supervisar:{cat:'analisis',base:3},coordinar:{cat:'analisis',base:3},resolver:{cat:'analisis',base:3},
  monitorear:{cat:'analisis',base:3},elaborar:{cat:'analisis',base:3},preparar:{cat:'analisis',base:3},
  planificar:{cat:'planificacion',base:4},planear:{cat:'planificacion',base:4},disenar:{cat:'planificacion',base:4},
  implementar:{cat:'planificacion',base:4},administrar:{cat:'planificacion',base:4},gestionar:{cat:'planificacion',base:4},
  organizar:{cat:'planificacion',base:4},proponer:{cat:'planificacion',base:4},establecer:{cat:'planificacion',base:4},
  desarrollar:{cat:'planificacion',base:4},programar:{cat:'planificacion',base:4},
  formular:{cat:'direccion',base:5},liderar:{cat:'direccion',base:5},autorizar:{cat:'direccion',base:5},
  normar:{cat:'direccion',base:5},reglamentar:{cat:'direccion',base:5},definir:{cat:'direccion',base:5},
  dictar:{cat:'direccion',base:5},aprobar:{cat:'direccion',base:5},conducir:{cat:'direccion',base:5},
};

const OBJ_CLASSES: [RegExp, ObjType, number][] = [
  [/documento|archivo|expediente|solicitud|papeleria|fotocopia|formulario|oficio|nota|fax|correspondencia|carta/i,'simple',-1],
  [/informe|estudio|reporte|programa|proyecto|plan|actividad|evento|tramite|proceso|procedimiento|auditoria|auditoria\s+interna|auditoria\s+de\s+cumplimiento|control|control\s+interno|operacion|evaluacion|evaluacion\s+de\s+riesgos|gestion\s+de\s+riesgos|riesgo|riesgos|hallazgo|hallazgos|recomendacion|recomendaciones|segumiento|plan\s+de\s+mejora|no\s+conformidad|incumplimiento|observacion|observaciones/i,'tecnico',0],
  [/politica|sistema|directriz|lineamiento|normativa|reglamento|presupuesto|contratacion|licitacion|estrategia/i,'estrategico',1],
  [/ley|decreto|institucion|municipalidad|nacional|rector/i,'directivo',2],
];

const SENIORITY_MAP: [RegExp, string, number, number, number, number, number][] = [
  [/director|gerente|subdirector/i, 'directivo', 5, 4, 4, 4, 5],
  [/jefe|subgerente|lider/i, 'jefatura', 4, 4, 3, 3, 4],
  [/supervisor|coordinador|encargado|oficial/i, 'supervision', 3, 3, 2, 2, 3],
  [/analista|especialista|profesional|instructor|inspector/i, 'profesional', 3, 2, 2, 2, 4],
  [/tecnico|operador/i, 'tecnico', 2, 1, 1, 1, 2],
  [/asistente|auxiliar|oficinista|recepcionista/i, 'apoyo', 1, 1, 1, 1, 1],
  [/conserje|mensajero|portero|chofer|guardia|vigilante/i, 'operativo', 1, 1, 1, 1, 1],
];

const SPECIALTY_MAP: [RegExp, number, number, number, number][] = [
  [/control\s+interno|auditoria/i, 3, 2, 3, 0],
  [/juridico|legal|asesoria/i, 3, 3, 3, 0],
  [/financiero|contabilidad|tesoreria|hacienda|proveeduria/i, 2, 3, 2, 0],
  [/presupuesto|compras|contratacion|licitacion/i, 2, 2, 2, 0],
  [/sistemas|informatica|tecnologia|digitalizacion|datos/i, 2, 1, 1, 0],
  [/proyectos|programa|planificacion|innovacion/i, 2, 1, 1, 0],
  [/rrhh|talento\s+humano|gestion\s+humana|recursos\s+humanos|seleccion|capacitacion/i, 1, 2, 1, 0],
  [/salud|medico|enfermeria|clinica|hospital|odontologia/i, 2, 2, 3, 0],
  [/obras|infraestructura|mantenimiento|construccion|ingenieria/i, 2, 1, 1, 2],
  [/policia|seguridad|transito|proteccion|resguardo/i, 1, 1, 3, 3],
  [/educacion|cultura|deportes|social|comunitario|desarrollo/i, 1, 1, 1, 0],
];

const AREA_RULES: [RegExp, Partial<RolProfile>][] = [
  [/control interno|auditoria|juridico|legal|asesoria legal/i,{baseResponsabilidad:3,baseError:3}],
  [/financiero|contabilidad|tesoreria|presupuesto|proveeduria|compras|hacienda/i,{baseResponsabilidad:4,baseError:3}],
  [/gestion humana|recursos humanos|talento humano|rrhh|seleccion|capacitacion/i,{baseResponsabilidad:3,baseError:2}],
  [/policia|seguridad|vigilancia|transito|proteccion|resguardo/i,{baseCondiciones:3,baseError:3}],
  [/tecnologia|sistemas|informatica|digitalizacion|innovacion|proyectos|datos/i,{baseDificultad:3}],
  [/salud|medico|enfermeria|clinica|hospital|odontologia/i,{baseResponsabilidad:3,baseError:3}],
  [/obras publicas|infraestructura|mantenimiento|construccion|ingenieria/i,{baseCondiciones:3}],
];

function norm(t:string):string{
  return (t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

function frases(t:string):string[]{
  return (t||'').split(/[.!;\n]+/).map(s=>s.trim()).filter(s=>s.length>10);
}

export function extraerAcciones(texto:string):Accion[]{
  const n=norm(texto); const r:Accion[]=[]; const seen=new Set<string>();
  const verbKeys=Object.keys(VERB_LEXICON);
  const V=new RegExp(`\\b(${verbKeys.join('|')})\\s+(?:a|de|al|la|el|los|las|un|una|del|en|por|su|sus|este|esta|estos|estas)\\s+((?:[a-z]+\\s+(?:de|del|de\\s+la|de\\s+los|de\\s+las|en|para|por|con|sin|bajo|mediante)\\s+)*[a-z]{3,50}?)(?=\\s*(?:,|;|\\.|$|para|con\\s+(?:el\\s+)?fin|mediante|segun|as[ií]|o\\s+bien))`,'gi');
  // Pattern 2: "responsable de + objeto"
  const R=/responsable\s+(?:de\s+|del?\s+)((?:[a-z]+\s+(?:de|del|de\s+la|de\s+los|de\s+las|en|para|por)\s+)*[a-z]{3,50}?)(?=\s*(?:,|;|\.|$))/gi;
  // Pattern 3: "encargado de + objeto"
  const E=/encargad[oa]\s+(?:de\s+|del?\s+)((?:[a-z]+\s+(?:de|del|de\s+la|de\s+los|de\s+las|en|para|por)\s+)*[a-z]{3,50}?)(?=\s*(?:,|;|\.|$))/gi;
  for(const s of frases(n)){
    for(const re of[V,R,E]){
      re.lastIndex=0;let m;
      while((m=re.exec(s))!==null){
        const vb=m[1]||'',ob=(m[2]||m[1]||'').trim().replace(/\s{2,}/g,' '),key=`${vb}:${ob.slice(0,30)}`;
        if(!seen.has(key)&&vb.length>2&&ob.length>3){seen.add(key);r.push({verbo:vb,verboNorm:vb,objeto:ob,oracion:s});}
      }
    }
  }
  return r;
}

function clasifObj(texto:string):{tipo:ObjType;boost:number}{
  for(const[re,tipo,boost]of OBJ_CLASSES)if(re.test(texto))return{tipo,boost};
  return{tipo:'tecnico',boost:0};
}

function clasifVerbo(v:string):VerbClass{return VERB_LEXICON[v]||{cat:'ejecucion',base:2};}

function analizarTituloCompuesto(nombre:string,area:string):RolProfile{
  const n=norm(nombre),a=norm(area);
  const base:RolProfile={nombre,baseDificultad:1,baseSupervision:1,baseResponsabilidad:1,baseCondiciones:1,baseError:1};
  for(const[re,_,d,sup,resp,err]of SENIORITY_MAP)
    if(re.test(n)){base.baseDificultad=d;base.baseSupervision=sup;base.baseResponsabilidad=resp;base.baseError=err;break;}
  for(const[re,dMin,respMin,errMin,condMin]of SPECIALTY_MAP)
    if(re.test(n)){base.baseDificultad=Math.max(base.baseDificultad,dMin);base.baseResponsabilidad=Math.max(base.baseResponsabilidad,respMin);base.baseError=Math.max(base.baseError,errMin);base.baseCondiciones=Math.max(base.baseCondiciones,condMin);}
  for(const[re,p]of AREA_RULES)
    if(re.test(a))Object.assign(base,p);
  return base;
}

function tienePersonal(acc:Accion[],t:string):boolean{
  if(/personal\s+a\s+cargo|supervisa\s+(?:al\s+)?personal|equipo\s+de\s+trabajo|grupo\s+de\s+trabajo|personas?\s+a\s+cargo|empleados?\s+a\s+cargo|colaboradores?\s+a\s+cargo|tiene\s+a\s+su\s+cargo|dirige\s+(?:un\s+)?(?:equipo|personal|grupo)/i.test(norm(t)))return true;
  for(const a of acc)if(['supervisar','dirigir','liderar','coordinar'].includes(a.verboNorm))return true;
  return false;
}

function tieneInfoSensible(fx:string,area:string):boolean{
  const fn=norm(fx),an=norm(area);
  if(/confidencial|informacion\s+sensible|datos\s+personales|informacion\s+reservada|custodia\s+de\s+informacion|auditoria|control\s+interno|fondos?\s+fijos|valores/.test(fn))return true;
  if(/control\s+interno|auditoria|juridico|legal|rrhh|gestion\s+humana/.test(an))return true;
  return false;
}

function clamp(g:number):number{return Math.max(1,Math.min(5,Math.round(g)));}

function evalDificultad(acc:TaggedAccion[],pf:RolProfile):FactorResult{
  const b=pf.baseDificultad||1;
  let g = 1;
  let hallazgos = '';
  let analisis = '';
  
  if(!acc.length){
    g = Math.max(1,b);
    hallazgos = 'No se identificaron acciones sustantivas en la descripcion de funciones ni en los procedimientos asociados.';
    analisis = `Ante la falta de evidencia detallada, se asume el perfil base del puesto "${pf.nombre}" que establece un minimo de Grado ${b}. Segun la rubrica MSC, el Grado ${g} se define como "${GRADE_DESCRIPTIONS.dificultad[g-1]}". No existe base documental para asignar un grado superior.`;
  } else {
    let tot=0;
    for(const a of acc){const vc=clasifVerbo(a.verboNorm),oc=clasifObj(a.objeto);tot+=clamp(vc.base+oc.boost);}
    let avg=Math.round(tot*10/acc.length)/10;
    let avgR=clamp(avg);
    g=avgR;
    
    let pfText='';
    if(pf.baseDificultad>0&&pf.baseDificultad>avgR){
      g=pf.baseDificultad;
      pfText=` Adicionalmente, el perfil del puesto "${pf.nombre}" requiere un nivel minimo de G${pf.baseDificultad}, predominando sobre el promedio analitico de las acciones.`;
    }

    const funcAcc = acc.filter(a => a.fuente === 'funciones').slice(0, 3);
    const procAcc = acc.filter(a => a.fuente === 'procedimiento');
    const procsMap = new Map<string, {nombre: string, acciones: string[]}>();
    procAcc.forEach(a => {
        const key = a.procCodigo || 'PR-GEN';
        if (!procsMap.has(key)) procsMap.set(key, {nombre: a.procNombre || 'Procedimiento', acciones: []});
        procsMap.get(key)!.acciones.push(a.oracion);
    });

    const hFunc = funcAcc.length > 0 ? `Se identificaron acciones sustantivas en la descripcion de funciones del puesto. Entre las mas relevantes: "${funcAcc.map(a => a.oracion).join('; ')}".` : '';
    const hProc = Array.from(procsMap.entries()).slice(0, 2).map(([cod, data]) => `En el procedimiento ${cod} (${data.nombre}), se establece que el puesto: "${data.acciones[0]}".`).join(' ');
    hallazgos = [hFunc, hProc].filter(Boolean).join(' ') || 'Se analizaron las funciones sin identificar citas literales destacables.';

    analisis = `Las acciones identificadas corresponden a funciones que promedian un nivel G${avgR} en complejidad.${pfText} Segun la rubrica MSC, el Grado ${g} de Dificultad de Funciones se define como "${GRADE_DESCRIPTIONS.dificultad[g-1]}", lo cual es consistente con la naturaleza y alcance de las tareas descritas. No se evidencian elementos suficientes que justifiquen una clasificacion distinta.`;
  }

  const resolucion = `Se asigna Grado ${g} (${POINTS_MAP.dificultad[g]} puntos de ${CONTINUOUS_MAX.dificultad} posibles) para el factor de Dificultad de Funciones.`;
  return { grado:g, puntos:POINTS_MAP.dificultad[g], justificacion:`HALLAZGOS:\n${hallazgos}\n\nANÁLISIS:\n${analisis}\n\nRESOLUCIÓN:\n${resolucion}` };
}

function evalSupervision(acc:TaggedAccion[],pf:RolProfile,t:string):FactorResult{
  let g=pf.baseSupervision||1;const tn=norm(t);const tp=tienePersonal(acc,t);let razon='';
  
  if(tp){
    const nivelTit=/jefe|director|gerente|subdirector|lider|supervisor/i.test(norm(pf.nombre));
    const nivelFunc=/coordina|supervisa|dirige|lidera/.test(tn);
    g=nivelTit?4:nivelFunc?3:2;
    razon=nivelTit?'jerarquia formal directiva o de jefatura':nivelFunc?'coordinacion y liderazgo evidenciado en funciones':'personal a cargo detectado';
    if(/departamento|unidad|direccion|gerencia|area\s+mayor/.test(tn)){g=Math.max(g,4);razon+=' con alcance de unidad completa';}
  }
  else if(/supervision\s+ocasional|apoya\s+supervision|guia\s+a\s+comp/.test(tn)){g=Math.max(g,2);razon='supervision ocasional y apoyo detectado';}
  else if(/sin\s+personal\s+a\s+cargo|no\s+supervisa|trabajo\s+individual|funciones\s+individuales/.test(tn)){g=Math.max(1,Math.min(2,g));razon='trabajo puramente individual, sin personal a cargo';}
  else razon='ausencia de evidencia sobre supervision de personal';
  
  let pfText='';
  if(pf.baseSupervision>g){g=pf.baseSupervision;pfText=` Ademas, el perfil del puesto "${pf.nombre}" demanda un nivel minimo de G${pf.baseSupervision}.`;}
  g=clamp(g);

  const oraciones = (t||'').split(/[.!;\n]+/).map(s=>s.trim()).filter(s=>s.length>5);
  let evidencia = oraciones.find(s => /personal\s+a\s+cargo|supervisa|equipo|grupo|dirige|coordina|lidera/i.test(norm(s)));
  let hallazgos = evidencia ? `Se evidencia responsabilidad de mando en el perfil o descripcion: "${evidencia}".` : `No se identificaron menciones textuales directas sobre tener personal a cargo en la descripcion de funciones.`;
  
  const procAcc = acc.filter(a => a.fuente === 'procedimiento' && ['supervisar','dirigir','liderar','coordinar'].includes(a.verboNorm));
  if (procAcc.length > 0) {
    hallazgos += ` En el procedimiento ${procAcc[0].procCodigo || 'PR-GEN'}, se indica: "${procAcc[0].oracion}".`;
  }

  const analisis = `El analisis identifica ${razon}.${pfText} Segun la rubrica MSC, el Grado ${g} de Supervision Ejercida se define como "${GRADE_DESCRIPTIONS.supervision[g-1]}". Esto resulta acorde con la naturaleza de la autoridad delegada al puesto. No existe justificacion suficiente para asignar un grado distinto.`;
  const resolucion = `Se asigna Grado ${g} (${POINTS_MAP.supervision[g]} puntos de ${CONTINUOUS_MAX.supervision} posibles) para el factor de Supervision Ejercida.`;

  return{grado:g,puntos:POINTS_MAP.supervision[g],justificacion:`HALLAZGOS:\n${hallazgos}\n\nANÁLISIS:\n${analisis}\n\nRESOLUCIÓN:\n${resolucion}`};
}

function evalResponsabilidad(acc:TaggedAccion[],pf:RolProfile,t:string):FactorResult{
  let g=pf.baseResponsabilidad||1;const tn=norm(t);let razon='';
  if(/responsable\s+(?:de\s+|del?\s+)(?:presupuesto|fondos|contratacion|licitacion|recursos\s+financieros|patrimonio|activos\s+financieros)/i.test(tn)){g=Math.max(g,4);razon='gestion directa de recursos financieros o presupuestos';}
  else if(/responsable\s+(?:de\s+|del?\s+)(?:informacion\s+sensible|confidencial|custodia|datos\s+personales|documentacion\s+reservada|valores|fondos\s+fijos)/i.test(tn)){g=Math.max(g,3);razon='manejo y custodia de informacion sensible o confidencial';}
  else if(tieneInfoSensible(t,pf.nombre)){g=Math.max(g,3);razon='naturaleza del area implica acceso a informacion sensible';}
  else if(/responsable\s+(?:de\s+|del?\s+)(?:materiales|equipo\s+menor|inventario|herramientas|suministros)/i.test(tn)){g=Math.max(g,2);razon='responsabilidad por materiales, suministros o equipo menor';}
  else if(/custodia|protege|resguarda|salvaguardar/i.test(tn)){g=Math.max(g,3);razon='responsabilidades formales de custodia y proteccion';}
  else if(/presupuesto|fondos|contratacion|licitacion|compras\s+mayores|activos\s+financieros|activos\s+institucionales/i.test(tn)){g=Math.max(g,4);razon='implicacion en la gestion de presupuestos institucionales';}
  else if(/gestion\s+total|proceso\s+clave|decision\s+estrategico|alto\s+impacto|recursos\s+institucionales/i.test(tn)){g=Math.max(g,5);razon='responsabilidad total sobre procesos clave de alto impacto';}
  else razon='responsabilidad operativa estandar';
  
  for(const a of acc)if(a.verboNorm==='administrar'||a.verboNorm==='gestionar'){const oc=clasifObj(a.objeto);if(oc.tipo==='estrategico'){g=Math.max(g,4);razon+=`, administracion de recursos estrategicos`;}if(oc.tipo==='directivo'){g=Math.max(g,5);razon+=`, gestion de nivel directivo`;}}
  
  let pfText='';
  if(pf.baseResponsabilidad>g){g=pf.baseResponsabilidad;pfText=` Por su pertenencia al area "${pf.nombre}", el perfil demanda un nivel minimo de G${pf.baseResponsabilidad}.`;}
  g=clamp(g);

  const oraciones = (t||'').split(/[.!;\n]+/).map(s=>s.trim()).filter(s=>s.length>5);
  let evidencia = oraciones.find(s => /presupuesto|fondos|informacion\s+sensible|confidencial|materiales|custodia|valores/i.test(norm(s)));
  let hallazgos = evidencia ? `La descripcion de funciones establece responsabilidades especificas: "${evidencia}".` : `Se analizo la descripcion funcional y no se encontraron citas explicitas sobre manejo de valores, fondos o informacion clasificada; se asume responsabilidad general del nivel.`;
  
  const procAcc = acc.filter(a => a.fuente === 'procedimiento' && ['administrar','gestionar','custodiar','controlar'].includes(a.verboNorm));
  if (procAcc.length > 0) {
    hallazgos += ` En el procedimiento ${procAcc[0].procCodigo || 'PR-GEN'}, se observa: "${procAcc[0].oracion}".`;
  }

  const analisis = `El alcance funcional refleja ${razon}.${pfText} Segun la rubrica MSC, el Grado ${g} de Responsabilidad se define como "${GRADE_DESCRIPTIONS.responsabilidad[g-1]}", ajustandose fielmente al grado de riesgo y autonomia exigido. Un nivel superior requeriria autoridad sobre activos de mayor criticidad institucional.`;
  const resolucion = `Se asigna Grado ${g} (${POINTS_MAP.responsabilidad[g]} puntos de ${CONTINUOUS_MAX.responsabilidad} posibles) para el factor de Responsabilidad.`;

  return{grado:g,puntos:POINTS_MAP.responsabilidad[g],justificacion:`HALLAZGOS:\n${hallazgos}\n\nANÁLISIS:\n${analisis}\n\nRESOLUCIÓN:\n${resolucion}`};
}

function evalCondiciones(acc:TaggedAccion[],t:string,pf:RolProfile):FactorResult{
  const tn=norm(t);let g=1;let razon='';
  const cm=(re:RegExp,gr:number,lb:string)=>{if(re.test(tn)&&gr>g){g=gr;razon=lb;}};
  cm(/trabajo\s+de\s+oficina|ambiente\s+controlado|trabajo\s+sedentario|ambiente\s+de\s+oficina/i,1,'desempeno en trabajo de oficina o ambiente controlado');
  cm(/esfuerzo\s+fisico\s+moderado|ambiente\s+incomodo|bipedestacion|de\s+pie|camina\s+frecuentemente|levanta\s+peso/i,2,'requerimiento de esfuerzo fisico moderado o bipedestacion');
  cm(/intemperie|via\s+publica|ambiente\s+variable|trabajo\s+de\s+campo|labores\s+de\s+campo|en\s+el\s+exterior|condiciones\s+climaticas|ruido\s+constante|calor\s+(?!humano|de\s+hogar)/i,3,'trabajo de campo a la intemperie o con exposicion climatica variable');
  cm(/riesgo\s+de\s+(?:accidente|caida|lesion|fisico|mecanico|electrico|quimico|biologico)|accidente\s+laboral|trabajo\s+en\s+altura|maquinaria\s+peligrosa|sustancias|quimicos|equipo\s+peligroso/i,4,'exposicion a riesgos de accidentes laborales o manejo de maquinaria/quimicos');
  cm(/alta\s+peligrosidad|insalubridad|enfermedad\s+profesional|ambiente\s+extremo|radiacion|peligro\s+constante|material\s+peligroso|alta\s+exposicion|toxicos/i,5,'alta peligrosidad o insalubridad constante');
  
  if(!razon)razon='condiciones de oficina normales sin exposicion particular';
  let pfText='';
  if(pf?.baseCondiciones>g){g=pf.baseCondiciones;pfText=` El perfil del area indica que el puesto exige base G${pf.baseCondiciones}.`;}
  g=clamp(g);

  const oraciones = (t||'').split(/[.!;\n]+/).map(s=>s.trim()).filter(s=>s.length>5);
  let evidencia = oraciones.find(s => /oficina|esfuerzo|intemperie|campo|riesgo|accidente|peligrosidad|insalubridad/i.test(norm(s)));
  let hallazgos = evidencia ? `El analisis del puesto indica sobre sus condiciones: "${evidencia}".` : `No se identifican descripciones explicitas de riesgo ambiental extremo en el texto de las funciones.`;

  const procAcc = acc.filter(a => a.fuente === 'procedimiento' && /condicion|ambiente|riesgo|campo|oficina/i.test(a.verboNorm + a.objeto));
  if (procAcc.length > 0) {
    hallazgos += ` En el procedimiento ${procAcc[0].procCodigo || 'PR-GEN'}, se describe un contexto afín: "${procAcc[0].oracion}".`;
  }

  const analisis = `Se evidencia ${razon}.${pfText} Segun la rubrica MSC, el Grado ${g} de Condiciones de Trabajo se define como "${GRADE_DESCRIPTIONS.condiciones[g-1]}", que refleja adecuadamente el entorno fisico y ergonomico. No se justifica modificar este grado por falta de mayor exposicion comprobada.`;
  const resolucion = `Se asigna Grado ${g} (${POINTS_MAP.condiciones[g]} puntos de ${CONTINUOUS_MAX.condiciones} posibles) para el factor de Condiciones de Trabajo.`;

  return{grado:g,puntos:POINTS_MAP.condiciones[g],justificacion:`HALLAZGOS:\n${hallazgos}\n\nANÁLISIS:\n${analisis}\n\nRESOLUCIÓN:\n${resolucion}`};
}

function evalError(acc:TaggedAccion[],t:string,pf:RolProfile):FactorResult{
  const tn=norm(t);let g=pf.baseError||1;let razon='';
  const cm=(re:RegExp,gr:number,lb:string)=>{if(re.test(tn)&&gr>g){g=gr;razon=lb;}};
  cm(/error\s+compromete\s+(?:la\s+)?estabilidad|seguridad\s+publica|reputacion\s+institucional|crisis|confianza\s+publica|irreversible|estabilidad\s+institucional/i,5,'impacto critico en la estabilidad institucional o seguridad publica');
  cm(/perdida\s+economica|perdida\s+financiera|multa|sancion|demanda|penal|consecuencia\s+legal|responsabilidad\s+legal|legal\s+(?!.*ilegal)/i,4,'riesgo de perdida economica o repercusiones legales significativas');
  cm(/afecta\s+(?:a\s+)?servicio|cliente|usuario|ciudadano|externo|interrumpe|departamento/i,3,'afectacion directa a servicios externos o ciudadanos');
  cm(/retraso\s+menor|demora|interno|proceso\s+interno|reasignacion/i,2,'retrasos operativos menores o impacto en procesos internos');
  
  if(/control\s+interno|auditoria|juridico|legal/i.test(norm(pf.nombre))){const ng=Math.max(g,3);if(ng>g){g=ng;razon='naturaleza de las funciones de auditoria/legal aumenta la trascendencia del error';}}
  if(/financiero|presupuesto|tesoreria|contabilidad/i.test(norm(pf.nombre))){const ng=Math.max(g,3);if(ng>g){g=ng;razon='naturaleza de las funciones financieras expone a la institucion';}}
  if(!razon)razon='impacto operativo de grado menor, facil de detectar y corregir';
  
  let pfText='';
  if(pf.baseError>g){g=pf.baseError;pfText=` Se considera un piso base de G${pf.baseError} por el impacto inherente al perfil.`;}
  g=clamp(g);

  const oraciones = (t||'').split(/[.!;\n]+/).map(s=>s.trim()).filter(s=>s.length>5);
  let evidencia = oraciones.find(s => /error|perdida|demanda|consecuencia|impacto|servicio|ciudadano/i.test(norm(s)));
  let hallazgos = evidencia ? `Respecto a las repercusiones del trabajo, el texto establece: "${evidencia}".` : `No se encuentran estipulaciones precisas sobre el impacto del error en la descripcion base, deduciendose de la naturaleza general del puesto.`;

  const procAcc = acc.filter(a => a.fuente === 'procedimiento' && /error|impacto|riesgo|consecuencia/i.test(a.verboNorm + a.objeto));
  if (procAcc.length > 0) {
    hallazgos += ` En el procedimiento ${procAcc[0].procCodigo || 'PR-GEN'}, se requiere precaucion por: "${procAcc[0].oracion}".`;
  }

  const analisis = `El analisis identifica ${razon}.${pfText} Segun la rubrica MSC, el Grado ${g} de Consecuencia del Error se define como "${GRADE_DESCRIPTIONS.error[g-1]}", que se corresponde con la magnitud de los perjuicios posibles. Un nivel superior estaria reservado a riesgos de mayor afectacion comprobada.`;
  const resolucion = `Se asigna Grado ${g} (${POINTS_MAP.error[g]} puntos de ${CONTINUOUS_MAX.error} posibles) para el factor de Consecuencia del Error.`;

  return{grado:g,puntos:POINTS_MAP.error[g],justificacion:`HALLAZGOS:\n${hallazgos}\n\nANÁLISIS:\n${analisis}\n\nRESOLUCIÓN:\n${resolucion}`};
}

const EDUC:[RegExp,number,string][]=[
  [/primaria|alfabeto|no\s+requiere/i,1,'educacion basica'],
  [/bachillerato|educacion\s+media|secundaria|tecnico\s+basico|educacion\s+diversificada/i,2,'bachillerato'],
  [/diplomado|tecnico\s+superior|parauniversitario|tecnico\s+medio/i,3,'tecnico superior'],
  [/licenciatura|bachillerato\s+universitario|grado\s+universitario|universitario/i,4,'licenciatura'],
  [/maestria|master|magister|especializacion|doctorado|phd|posgrado/i,5,'maestria/doctorado'],
];

function evalRequisitos(educacion:string):FactorResult{
  const tn=norm(educacion);
  if(/no\s+(?:requiere|necesita|exige|se\s+requiere|se\s+exige)/i.test(tn)) {
    const hallazgos = `Se especifica formalmente que el puesto no requiere educacion academica ("${educacion}").`;
    const analisis = `Al no solicitar estudios especificos, el puesto se ubica en el escalafon inicial. Segun la rubrica MSC, el Grado 1 se define como "${GRADE_DESCRIPTIONS.requisitos[0]}".`;
    const resolucion = `Se asigna Grado 1 (${POINTS_MAP.requisitos[1]} puntos de ${CONTINUOUS_MAX.requisitos} posibles) para el factor de Requisitos.`;
    return{grado:1,puntos:POINTS_MAP.requisitos[1],justificacion:`HALLAZGOS:\n${hallazgos}\n\nANÁLISIS:\n${analisis}\n\nRESOLUCIÓN:\n${resolucion}`};
  }
  let mg=1,lb='educacion basica';
  for(const[re,g,lbl]of EDUC)if(re.test(tn)&&g>mg){mg=g;lb=lbl;}
  
  const hallazgos = educacion ? `El requerimiento formal del perfil documenta: "${educacion.trim()}".` : `No se dispone de texto formal sobre requisitos de educacion, infiriendose la educacion basica.`;
  const analisis = `Los estudios exigidos corresponden a la clasificacion de ${lb}. Segun la rubrica MSC, el Grado ${mg} de Requisitos se define como "${GRADE_DESCRIPTIONS.requisitos[mg-1]}". Este grado refleja fielmente el nivel de preparacion academica obligatoria para el adecuado cumplimiento de las funciones descritas.`;
  const resolucion = `Se asigna Grado ${mg} (${POINTS_MAP.requisitos[mg]} puntos de ${CONTINUOUS_MAX.requisitos} posibles) para el factor de Requisitos.`;

  return{grado:mg,puntos:POINTS_MAP.requisitos[mg],justificacion:`HALLAZGOS:\n${hallazgos}\n\nANÁLISIS:\n${analisis}\n\nRESOLUCIÓN:\n${resolucion}`};
}

export function evalProcedimientos(procCtx:any):{ref:string[];acc:TaggedAccion[]}{
  const ref:string[]=[],acc:TaggedAccion[]=[];
  if(!procCtx)return{ref,acc};
  const fuentes:{campo?:string;label:string;codigo?:string;nombre?:string}[]=[
    {campo:procCtx.textoCompleto,label:'texto completo'},
    ...(procCtx.procedimientos||[]).flatMap((p:any)=>[
      {campo:p.proposito,label:`proposito ${p.nombre||p.codigo}`,codigo:p.codigo,nombre:p.nombre},
      {campo:p.alcance,label:`alcance ${p.nombre||p.codigo}`,codigo:p.codigo,nombre:p.nombre},
    ]),
    ...(procCtx.pasos||[]).map((s:any)=>({campo:s.descripcion,label:`paso ${s.procedimiento_codigo}`,codigo:s.procedimiento_codigo,nombre:s.procedimiento_nombre})),
    ...(procCtx.politicas||[]).map((p:any)=>({campo:p.politica,label:`politica ${p.procedimiento_codigo}`,codigo:p.procedimiento_codigo,nombre:p.procedimiento_nombre})),
  ];
  for(const f of fuentes){
    if(!f.campo)continue;
    const ex=extraerAcciones(f.campo);
    if(ex.length)ref.push(`${ex.length} de ${f.label}`);
    const tagged = ex.map(a => ({...a, fuente: 'procedimiento' as const, procCodigo: f.codigo, procNombre: f.nombre}));
    acc.push(...tagged);
  }
  return{ref,acc};
}

export function contextualEvaluate(puesto:any,procCtx?:any):AIEvaluationResult{
  const fx=puesto.descripcion_funciones||'',ed=puesto.educacion_requerida||'';
  const pf=analizarTituloCompuesto(puesto.nombre||'',puesto.area||'');
  const accFx = extraerAcciones(fx).map(a => ({...a, fuente: 'funciones' as const} as TaggedAccion));
  const pr = evalProcedimientos(procCtx);
  const all: TaggedAccion[]=[...accFx,...pr.acc];
  const textoCompleto=[fx,procCtx?.textoCompleto||''].filter(Boolean).join('\\n');
  const res:Record<string,FactorResult>={
    dificultad:evalDificultad(all,pf),
    supervision:evalSupervision(all,pf,textoCompleto),
    responsabilidad:evalResponsabilidad(all,pf,textoCompleto),
    condiciones:evalCondiciones(all,textoCompleto,pf),
    error:evalError(all,textoCompleto,pf),
    requisitos:evalRequisitos(ed),
  };
  const data:EvaluationSuggestion={
    dificultad:res.dificultad.grado,dificultad_just:res.dificultad.justificacion,
    supervision:res.supervision.grado,supervision_just:res.supervision.justificacion,
    responsabilidad:res.responsabilidad.grado,responsabilidad_just:res.responsabilidad.justificacion,
    condiciones:res.condiciones.grado,condiciones_just:res.condiciones.justificacion,
    error:res.error.grado,error_just:res.error.justificacion,
    requisitos:res.requisitos.grado,requisitos_just:res.requisitos.justificacion,
  };
  let total=0;const fp:Record<string,number>={};
  for(const f of['dificultad','supervision','responsabilidad','condiciones','error','requisitos']){const g=res[f].grado;const pts=POINTS_MAP[f][g];total+=pts;fp[f]=pts;}
  const pc:string[]=pr.ref.length?['dificultad','responsabilidad']:[];
  return{success:true,data,totalPuntos:total,puesto_id:puesto.id,analisis_completo:true,motor:'rule-based',procedimientosCount:procCtx?.totalProcedimientos||0,factorPoints:fp,buildVersion:'v12-contextual',procContribution:pc};
}

