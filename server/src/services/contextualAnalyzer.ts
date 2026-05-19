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

type VerbCat = 'operativo'|'ejecucion'|'analisis'|'planificacion'|'direccion';
type ObjType = 'simple'|'tecnico'|'estrategico'|'directivo';

interface VerbClass { cat: VerbCat; base: number }
interface Accion { verbo: string; verboNorm: string; objeto: string; oracion: string }
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
  analizar:{cat:'analisis',base:3},evaluar:{cat:'analisis',base:3},diagnosticar:{cat:'analisis',base:3},
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
  [/informe|estudio|reporte|programa|proyecto|plan|actividad|evento|tramite|proceso|procedimiento|auditoria|control|operacion/i,'tecnico',0],
  [/politica|sistema|directriz|lineamiento|normativa|reglamento|presupuesto|contratacion|licitacion|estrategia/i,'estrategico',1],
  [/ley|decreto|institucion|municipalidad|nacional|rector/i,'directivo',2],
];

const TITLE_RULES: [RegExp, Partial<RolProfile>][] = [
  [/asistente|auxiliar|oficinista|conserje|mensajero|portero|chofer|guardia|vigilante|recepcionista/i,
   {baseDificultad:1,baseSupervision:1,baseResponsabilidad:1,baseCondiciones:1,baseError:1}],
  [/tecnico|analista|especialista|profesional|instructor|inspector|supervisor|coordinador|encargado|oficial/i,
   {baseDificultad:3,baseSupervision:2,baseResponsabilidad:2,baseCondiciones:2,baseError:2}],
  [/jefe|director|gerente|subdirector|lider|subgerente/i,
   {baseDificultad:4,baseSupervision:4,baseResponsabilidad:4,baseCondiciones:2,baseError:4}],
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

function extraerAcciones(texto:string):Accion[]{
  const n=norm(texto); const r:Accion[]=[]; const seen=new Set<string>();
  const pts=[/(\w+)\s+(?:a|de|al|la|el|los|las|un|una|del|en|por|su|sus)?\s+([a-z]{3,60}?)(?=\s+(?:para|con\s+(?:el\s+)?fin|a\s+trav|mediante|segun|[,.;])|$)/gi,
    /responsable\s+(?:de\s+|del?\s+)([a-z\s]{3,60}?)(?=[,.;]|$)/gi,/encargad[oa]\s+(?:de\s+|del?\s+)([a-z\s]{3,60}?)(?=[,.;]|$)/gi];
  for(const s of frases(n))
    for(const re of pts){
      re.lastIndex=0; let m;
      while((m=re.exec(s))!==null){
        const vb=m[1]||'',ob=(m[2]||m[1]||'').trim(),key=`${vb}:${ob.slice(0,20)}`;
        if(!seen.has(key)&&vb.length>2&&ob.length>2){seen.add(key);r.push({verbo:vb,verboNorm:vb,objeto:ob,oracion:s});}
      }
    }
  return r;
}

function clasifObj(texto:string):{tipo:ObjType;boost:number}{
  for(const[re,tipo,boost]of OBJ_CLASSES)if(re.test(texto))return{tipo,boost};
  return{tipo:'tecnico',boost:0};
}

function clasifVerbo(v:string):VerbClass{return VERB_LEXICON[v]||{cat:'ejecucion',base:2};}

function analizarPerfilPuesto(nombre:string,area:string):RolProfile{
  const n=norm(nombre),a=norm(area);
  const base:RolProfile={nombre,baseDificultad:0,baseSupervision:0,baseResponsabilidad:0,baseCondiciones:0,baseError:0};
  for(const[re,p]of TITLE_RULES){if(re.test(n)){Object.assign(base,p);break;}}
  for(const[re,p]of AREA_RULES){if(re.test(a))Object.assign(base,p);}
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

function evalDificultad(acc:Accion[],pf:RolProfile):FactorResult{
  if(!acc.length){const g=Math.max(1,pf.baseDificultad||1);return{grado:g,puntos:POINTS_MAP.dificultad[g],justificacion:`Evaluacion de Dificultad: no se identificaron acciones especificas. Se asigna Grado ${g} segun el perfil del puesto.`};}
  let tot=0;const det:string[]=[];
  for(const a of acc){const vc=clasifVerbo(a.verboNorm),oc=clasifObj(a.objeto),g=clamp(vc.base+oc.boost);tot+=g;det.push(`'${a.verbo} ${a.objeto}' (G${g})`);}
  let avg=tot/acc.length;if(pf.baseDificultad>0)avg=Math.max(avg,pf.baseDificultad);
  const g=clamp(avg);
  return{grado:g,puntos:POINTS_MAP.dificultad[g],justificacion:`Evaluacion de Dificultad: ${acc.length} acciones identificadas: ${det.join('; ')}.${pf.baseDificultad>0?` Perfil minimo G${pf.baseDificultad}.`:''} Resultado: Grado ${g}.`};
}

function evalSupervision(acc:Accion[],pf:RolProfile,t:string):FactorResult{
  let g=pf.baseSupervision||1;
  if(tienePersonal(acc,t)){g=/jefe|director|gerente|subdirector|lider|supervisor/i.test(norm(pf.nombre))?4:/coordina|supervisa|dirige|lidera/.test(norm(t))?3:2;if(/departamento|unidad|direccion|gerencia|area\s+mayor/.test(norm(t)))g=Math.max(g,4);}
  else if(/supervision\s+ocasional|apoya\s+supervision|guia\s+a\s+comp/.test(norm(t)))g=Math.max(g,2);
  else if(/sin\s+personal\s+a\s+cargo|no\s+supervisa|trabajo\s+individual|funciones\s+individuales/.test(norm(t)))g=Math.max(1,Math.min(2,g));
  g=clamp(g);
  return{grado:g,puntos:POINTS_MAP.supervision[g],justificacion:`Evaluacion de Supervision: el puesto "${pf.nombre}"${tienePersonal(acc,t)?' tiene personal a cargo':' no tiene personal a cargo explicito'}${pf.baseSupervision>0?`. Perfil base G${pf.baseSupervision}`:''}. Resultado: Grado ${g}.`};
}

function evalResponsabilidad(acc:Accion[],pf:RolProfile,t:string):FactorResult{
  let g=pf.baseResponsabilidad||1;const tn=norm(t);
  if(/responsable\s+(?:de\s+|del?\s+)(?:presupuesto|fondos|contratacion|licitacion|recursos\s+financieros|patrimonio|activos\s+financieros)/i.test(tn))g=Math.max(g,4);
  else if(/responsable\s+(?:de\s+|del?\s+)(?:informacion\s+sensible|confidencial|custodia|datos\s+personales|documentacion\s+reservada|valores|fondos\s+fijos)/i.test(tn))g=Math.max(g,3);
  else if(tieneInfoSensible(t,pf.nombre))g=Math.max(g,3);
  else if(/responsable\s+(?:de\s+|del?\s+)(?:materiales|equipo\s+menor|inventario|herramientas|suministros)/i.test(tn))g=Math.max(g,2);
  else if(/custodia|protege|resguarda|salvaguardar/i.test(tn))g=Math.max(g,3);
  else if(/presupuesto|fondos|contratacion|licitacion|compras\s+mayores|activos\s+financieros|activos\s+institucionales/i.test(tn))g=Math.max(g,4);
  else if(/gestion\s+total|proceso\s+clave|decision\s+estrategico|alto\s+impacto|recursos\s+institucionales/i.test(tn))g=Math.max(g,5);
  for(const a of acc)if(a.verboNorm==='administrar'||a.verboNorm==='gestionar'){const oc=clasifObj(a.objeto);if(oc.tipo==='estrategico')g=Math.max(g,4);if(oc.tipo==='directivo')g=Math.max(g,5);}
  g=clamp(g);
  return{grado:g,puntos:POINTS_MAP.responsabilidad[g],justificacion:`Evaluacion de Responsabilidad: el area "${pf.nombre}" implica${tieneInfoSensible(t,pf.nombre)?' manejo de informacion sensible/confidencial':' responsabilidades institucionales'}.${pf.baseResponsabilidad>0?` Perfil minimo G${pf.baseResponsabilidad}.`:''} Resultado: Grado ${g}.`};
}

function evalCondiciones(t:string):FactorResult{
  const tn=norm(t);let g=1;
  const cm=(re:RegExp,gr:number)=>{if(re.test(tn))g=Math.max(g,gr);};
  cm(/trabajo\s+de\s+oficina|ambiente\s+controlado|trabajo\s+sedentario|ambiente\s+de\s+oficina/i,1);
  cm(/esfuerzo\s+fisico\s+moderado|ambiente\s+incomodo|bipedestacion|de\s+pie|camina\s+frecuentemente|levanta\s+peso/i,2);
  cm(/intemperie|via\s+publica|ambiente\s+variable|trabajo\s+de\s+campo|labores\s+de\s+campo|en\s+el\s+exterior|condiciones\s+climaticas|ruido\s+constante|calor\s+(?!humano|de\s+hogar)/i,3);
  cm(/riesgo\s+de\s+(?:accidente|caida|lesion|fisico|mecanico|electrico|quimico|biologico)|accidente\s+laboral|trabajo\s+en\s+altura|maquinaria\s+peligrosa|sustancias|quimicos|equipo\s+peligroso/i,4);
  cm(/alta\s+peligrosidad|insalubridad|enfermedad\s+profesional|ambiente\s+extremo|radiacion|peligro\s+constante|material\s+peligroso|alta\s+exposicion|toxicos/i,5);
  g=clamp(g);
  return{grado:g,puntos:POINTS_MAP.condiciones[g],justificacion:`Evaluacion de Condiciones de Trabajo: entorno${g>3?' con riesgos laborales significativos':g>1?' con exigencias fisicas':' de oficina controlado'}. Resultado: Grado ${g}.`};
}

function evalError(t:string,pf:RolProfile):FactorResult{
  const tn=norm(t);let g=pf.baseError||1;
  if(/error\s+compromete\s+(?:la\s+)?estabilidad|seguridad\s+publica|reputacion\s+institucional|crisis|confianza\s+publica|irreversible|estabilidad\s+institucional/i.test(tn))g=Math.max(g,5);
  else if(/perdida\s+economica|perdida\s+financiera|multa|sancion|demanda|penal|consecuencia\s+legal|responsabilidad\s+legal|legal\s+(?!.*ilegal)/i.test(tn))g=Math.max(g,4);
  else if(/afecta\s+(?:a\s+)?servicio|cliente|usuario|ciudadano|externo|interrumpe|departamento/i.test(tn))g=Math.max(g,3);
  else if(/retraso\s+menor|demora|interno|proceso\s+interno|reasignacion/i.test(tn))g=Math.max(g,2);
  if(/control\s+interno|auditoria|juridico|legal/i.test(norm(pf.nombre)))g=Math.max(g,3);
  if(/financiero|presupuesto|tesoreria|contabilidad/i.test(norm(pf.nombre)))g=Math.max(g,3);
  if(/facil\s+de\s+corregir|facil\s+de\s+detectar|sin\s+impacto|bajo\s+impacto|minimo\s+efecto/i.test(tn))g=Math.max(g,1);
  g=clamp(g);
  return{grado:g,puntos:POINTS_MAP.error[g],justificacion:`Evaluacion de Consecuencia del Error: el puesto${pf.baseError>1?` en ${pf.nombre}`:''} implica${g>=4?' consecuencias economicas/legales':g>=3?' impacto en servicio externo':g>=2?' retrasos operativos':' bajo impacto'}. Resultado: Grado ${g}.`};
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
  if(/no\s+(?:requiere|necesita|exige|se\s+requiere|se\s+exige)/i.test(tn))
    return{grado:1,puntos:POINTS_MAP.requisitos[1],justificacion:'Evaluacion de Requisitos: no se requiere formacion academica especifica. Resultado: Grado 1.'};
  let mg=1,lb='educacion basica';
  for(const[re,g,lbl]of EDUC)if(re.test(tn)&&g>mg){mg=g;lb=lbl;}
  return{grado:mg,puntos:POINTS_MAP.requisitos[mg],justificacion:`Evaluacion de Requisitos: se requiere "${lb}" (Grado ${mg}). Resultado: Grado ${mg}.`};
}

function evalProcedimientos(procCtx:any,pf:RolProfile):{ref:string[];acc:Accion[]}{
  const ref:string[]=[],acc:Accion[]=[];
  if(!procCtx?.textoCompleto)return{ref,acc};
  const pa=extraerAcciones(procCtx.textoCompleto);acc.push(...pa);
  if(pa.length>0)ref.push(`${pa.length} acciones de ${procCtx.totalProcedimientos} procedimientos`);
  if(procCtx.procedimientos)for(const p of procCtx.procedimientos)if(p.proposito)acc.push(...extraerAcciones(p.proposito));
  return{ref,acc};
}

export function contextualEvaluate(puesto:any,procCtx?:any):AIEvaluationResult{
  const fx=puesto.descripcion_funciones||'',ed=puesto.educacion_requerida||'';
  const pf=analizarPerfilPuesto(puesto.nombre||'',puesto.area||'');
  const acc=extraerAcciones(fx),pr=evalProcedimientos(procCtx,pf);
  const all=[...acc,...pr.acc];
  const res:Record<string,FactorResult>={
    dificultad:evalDificultad(all,pf),supervision:evalSupervision(all,pf,fx),
    responsabilidad:evalResponsabilidad(all,pf,fx),condiciones:evalCondiciones(fx),error:evalError(fx,pf),requisitos:evalRequisitos(ed),
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
