import PDFDocument from 'pdfkit';
import type { ProcedimientosContext } from './procedimientosService';

const POINTS_MAP: Record<string, number[]> = {
  dificultad: [0, 40, 80, 120, 160, 200],
  supervision: [0, 30, 60, 90, 120, 150],
  responsabilidad: [0, 40, 80, 120, 160, 200],
  condiciones: [0, 20, 40, 60, 80, 100],
  error: [0, 30, 60, 90, 120, 150],
  requisitos: [0, 40, 80, 120, 160, 200]
};

const FACTOR_DISPLAY: Record<string, { label: string; key: string; max: number }> = {
  dificultad: { label: 'Dificultad de Funciones', key: 'dificultad', max: 200 },
  supervision: { label: 'Supervision Ejercida', key: 'supervision', max: 150 },
  responsabilidad: { label: 'Responsabilidad', key: 'responsabilidad', max: 200 },
  condiciones: { label: 'Condiciones de Trabajo', key: 'condiciones', max: 100 },
  error: { label: 'Consecuencia del Error', key: 'error', max: 150 },
  requisitos: { label: 'Requisitos', key: 'requisitos', max: 200 },
};

const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];

const GRADES_DESC: Record<string, string[]> = {
  dificultad: ['Tareas simples y repetitivas', 'Tareas variadas estandarizadas', 'Analisis y juicio tecnico', 'Alta complejidad y planeacion', 'Direccion estrategica'],
  supervision: ['No ejerce supervision', 'Supervision ocasional', 'Supervision de grupo operativo', 'Jefatura de unidad', 'Direccion de area mayor'],
  responsabilidad: ['Baja responsabilidad', 'Responsabilidad moderada', 'Custodia de info sensible', 'Responsabilidad por presupuestos', 'Gestion de proceso clave'],
  condiciones: ['Oficina normal', 'Esfuerzo moderado', 'Exposicion climatica o ruido', 'Riesgo de accidentes', 'Alta peligrosidad'],
  error: ['Error facil de corregir', 'Retrasos menores', 'Afecta otros deptos', 'Perdidas economicas/legales', 'Compromete estabilidad'],
  requisitos: ['Educacion basica', 'Bachillerato / Tecnico', 'Diplomado / Tecnico sup.', 'Licenciatura', 'Maestria / Doctorado'],
};

const GRADE_COLORS = ['#64748b', '#3b82f6', '#0ea5e9', '#8b5cf6', '#059669'];
const GRADE_BADGE_COLORS = ['#475569', '#2563eb', '#0284c7', '#7c3aed', '#047857'];

const ESTRATOS_MUNICIPALES = [
  { nombre: 'Operativo Municipal 1', puntos: 140, serie: 'Operativa' },
  { nombre: 'Operativo Municipal 2', puntos: 170, serie: 'Operativa' },
  { nombre: 'Operativo Municipal 3', puntos: 210, serie: 'Operativa' },
  { nombre: 'Operativo Municipal 4', puntos: 260, serie: 'Operativa' },
  { nombre: 'Operativo Municipal 5', puntos: 265, serie: 'Operativa' },
  { nombre: 'Operativo Municipal 6', puntos: 355, serie: 'Operativa' },
  { nombre: 'Administrativo Municipal 1', puntos: 255, serie: 'Administrativa' },
  { nombre: 'Administrativo Municipal 2', puntos: 270, serie: 'Administrativa' },
  { nombre: 'Administrativo Municipal 3', puntos: 280, serie: 'Administrativa' },
  { nombre: 'Administrativo Municipal 4', puntos: 355, serie: 'Administrativa' },
  { nombre: 'Policia Municipal 1', puntos: 210, serie: 'Policia' },
  { nombre: 'Policia Municipal 2', puntos: 280, serie: 'Policia' },
  { nombre: 'Policia Municipal 3', puntos: 270, serie: 'Policia' },
  { nombre: 'Policia Municipal 4', puntos: 330, serie: 'Policia' },
  { nombre: 'Policia Municipal 5', puntos: 345, serie: 'Policia' },
  { nombre: 'Tecnico Municipal 1', puntos: 270, serie: 'Tecnica' },
  { nombre: 'Tecnico Municipal 2', puntos: 330, serie: 'Tecnica' },
  { nombre: 'Tecnico Municipal 3', puntos: 390, serie: 'Tecnica' },
  { nombre: 'Profesional Municipal 1', puntos: 375, serie: 'Profesional' },
  { nombre: 'Profesional Municipal 1 (Prohib.)', puntos: 415, serie: 'Profesional' },
  { nombre: 'Profesional Municipal 2', puntos: 410, serie: 'Profesional' },
  { nombre: 'Profesional Municipal 2 (Prohib.)', puntos: 440, serie: 'Profesional' },
  { nombre: 'Profesional Municipal 3', puntos: 455, serie: 'Profesional' },
  { nombre: 'Profesional Municipal 3 (Prohib.)', puntos: 485, serie: 'Profesional' },
  { nombre: 'Profesional Municipal 4', puntos: 605, serie: 'Profesional' },
  { nombre: 'Profesional Municipal 4 (Prohib.)', puntos: 610, serie: 'Profesional' },
  { nombre: 'Profesional Jefe 1', puntos: 645, serie: 'Jefatura' },
  { nombre: 'Profesional Jefe 2 (Prohib.)', puntos: 700, serie: 'Jefatura' },
  { nombre: 'Profesional Jefe 3 (Prohib.)', puntos: 800, serie: 'Jefatura' },
  { nombre: 'Profesional Jefe 4 (Prohib.)', puntos: 845, serie: 'Jefatura' },
  { nombre: 'Profesional Jefe 5 (Prohib.)', puntos: 880, serie: 'Jefatura' },
];

function getClaseSugerida(puntos: number): { nombre: string; serie: string } | null {
  const candidatos = ESTRATOS_MUNICIPALES
    .filter(e => e.puntos <= puntos)
    .sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      return a.nombre.includes('(Prohib.)') ? 1 : -1;
    });
  return candidatos[0] || null;
}

const PW = 595.28, PH = 841.89, MG = 50, CW = PW - MG * 2;
const MAX_Y = PH - MG - 36;
const C = { primary: '#1e3a5f', secondary: '#0ea5e9', accent: '#047857', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', surface: '#f8fafc' };

function grado(g: number): number { return Math.max(1, Math.min(5, g)); }

class ReportGenerator {
  private doc: typeof PDFDocument.prototype;
  private y: number;
  private pageNum = 0;

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4', margin: MG,
      info: { Title: 'Informe Tecnico de Valoracion de Puestos', Author: 'Agente Evaluador IA - Municipalidad de San Carlos', Subject: 'Valoracion Salarial - Metodologia MSC', Creator: 'Sistema Integral RRHH' }
    });
    this.y = MG;
  }

  private checkPage(needed: number = 80): void {
    if (this.y + needed > MAX_Y) { this.doc.addPage(); this.y = MG; this.pageNum++; this.addFooter(); }
  }

  private addFooter(): void {
    this.doc.fontSize(7).font('Helvetica').fillColor('#94a3b8');
    this.doc.text(`Pagina ${this.pageNum}`, MG, PH - 28, { align: 'center' });
  }

  private addHeader(): void {
    this.doc.rect(0, 0, PW, 62).fill(C.primary);
    this.doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold');
    this.doc.text('Municipalidad de San Carlos', MG, 14, { align: 'center' });
    this.doc.fontSize(10).font('Helvetica');
    this.doc.text('Sistema Integral de RRHH — Valoracion de Puestos', MG, 33, { align: 'center' });
    this.doc.fontSize(9).font('Helvetica-Oblique');
    this.doc.text('Metodologia MSC — Puntos por Factores', MG, 48, { align: 'center' });
    this.doc.rect(0, 62, PW, 3).fill(C.secondary);
    this.y = 76;
    this.pageNum = 1;
    this.addFooter();
  }

  private addSectionTitle(title: string): void {
    this.checkPage(36);
    this.doc.rect(MG, this.y, CW, 22).fill(C.surface);
    this.doc.rect(MG, this.y, 4, 22).fill(C.secondary);
    this.doc.fontSize(11).font('Helvetica-Bold').fillColor(C.primary);
    this.doc.text(title, MG + 14, this.y + 4);
    this.y += 30;
  }

  private addField(label: string, value: string): void {
    this.checkPage(24);
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text(label, MG, this.y);
    this.y += 9;
    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    this.doc.text(value || 'No especificado', MG, this.y);
    this.y += 15;
  }

  private addFunctionsBlock(label: string, text: string): void {
    const opts = { width: CW, align: 'justify' as const, lineGap: 2 };
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text(label, MG, this.y);
    this.y += 9;
    this.doc.fontSize(9).font('Helvetica').fillColor(C.text);
    const t = text || 'No especificado';
    const h = this.doc.heightOfString(t, opts);
    this.checkPage(h + 24);
    this.doc.text(t, MG, this.y, opts);
    this.y += h + 6;
  }

  private addProcedimientosBlock(procedimientos: ProcedimientosContext): void {
    this.addSectionTitle('3. Contexto Operativo (Procedimientos Asociados)');
    this.doc.fontSize(8.5).font('Helvetica').fillColor(C.muted);
    const intro = `Se identificaron ${procedimientos.totalProcedimientos} procedimientos asociados al area del puesto.`;
    this.doc.text(intro, MG, this.y, { width: CW });
    this.y += 14;
    for (const proc of procedimientos.procedimientos) {
      this.checkPage(30);
      this.doc.rect(MG, this.y, CW, 0.5).fill(C.border);
      this.y += 5;
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor(C.primary);
      this.doc.text(`${proc.nombre} (${proc.codigo})`, MG, this.y);
      this.y += 12;
      if (proc.proposito) {
        this.doc.fontSize(8.5).font('Helvetica').fillColor(C.text);
        const ph = this.doc.heightOfString(proc.proposito, { width: CW, align: 'justify' });
        this.doc.text(proc.proposito, MG, this.y, { width: CW, align: 'justify' });
        this.y += ph + 4;
      }
    }
  }

  private addFactorsTable(evaluacion: any): void {
    this.checkPage(120);
    const colW = [160, 50, 55, 55, 70]; const rh = 24;
    const rows = FACTORS.map(f => {
      const d = FACTOR_DISPLAY[f]; const g = grado(evaluacion[`grado_${f}`] || 1);
      const p = POINTS_MAP[f][g] || 0; return { label: d.label, grado: g, puntos: p, max: d.max, pct: Math.round(p / d.max * 100) };
    });
    const total = rows.reduce((s, r) => s + r.puntos, 0);
    const hh = this.y;
    let cx = MG;
    this.doc.rect(MG, hh, CW, rh).fill(C.primary);
    const hdrs = ['Factor', 'Grado', 'Pts', 'Max', '%'];
    for (let i = 0; i < colW.length; i++) {
      this.doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      this.doc.text(hdrs[i], cx + 5, hh + 6, { width: colW[i] - 10, align: i === 0 ? 'left' : 'center' });
      cx += colW[i];
    }
    this.y = hh + rh;
    for (let ri = 0; ri < rows.length; ri++) {
      const r = rows[ri]; const bg = ri % 2 === 0 ? C.surface : '#ffffff';
      this.checkPage(rh + 4);
      cx = MG; const ry = this.y;
      this.doc.fillColor(bg).rect(cx, ry, CW, rh).fill();
      const vals = [r.label, `G${r.grado}`, `${r.puntos}`, `${r.max}`, `${r.pct}%`];
      for (let i = 0; i < colW.length; i++) {
        this.doc.fillColor(C.text).fontSize(8).font('Helvetica');
        this.doc.text(vals[i], cx + 5, ry + 6, { width: colW[i] - 10, align: i === 0 ? 'left' : 'center' });
        if (i === 4) {
          const bw = (colW[i] - 16) * r.pct / 100;
          if (bw > 4) { this.doc.fillColor(GRADE_COLORS[r.grado - 1]); this.doc.rect(cx + 6, ry + 17, bw, 3).fill(); }
        }
        cx += colW[i];
      }
      this.y += rh;
    }
    this.doc.rect(MG, this.y, CW, 1.5).fill(C.primary);
    this.y += 6;
    this.doc.fontSize(11).font('Helvetica-Bold').fillColor(C.primary);
    this.doc.text(`TOTAL: ${total} / 1000 pts`, MG, this.y);
    this.y += 20;
  }

  private addFactorDetail(evaluacion: any): void {
    this.checkPage(50);
    this.addSectionTitle('5. Detalle Tecnico por Factor');
    for (const factor of FACTORS) {
      const d = FACTOR_DISPLAY[factor]; const g = grado(evaluacion[`grado_${factor}`] || 1);
      const p = POINTS_MAP[factor][g] || 0;
      const just = (evaluacion[`justif_${factor}`] || '').trim();
      const desc = GRADES_DESC[factor]?.[g - 1] || '';
      const gi = g - 1;

      const justOpts = { width: CW - 28, align: 'justify' as const, lineGap: 2 };
      const jh = this.doc.heightOfString(just, justOpts);
      const cardH = Math.max(jh + 58, 70);
      const maxCard = Math.min(cardH, MAX_Y - MG);
      this.checkPage(maxCard + 12);
      const by = this.y;

      // Left accent
      this.doc.fillColor(GRADE_COLORS[gi]).rect(MG, by, 4, maxCard).fill();
      // White bg
      this.doc.fillColor('#ffffff').rect(MG + 4, by, CW - 4, maxCard).fill();
      // Top border
      this.doc.fillColor(C.border).rect(MG + 4, by, CW - 4, 1).fill();

      // Header bar inside card
      this.doc.fillColor(GRADE_COLORS[gi]).rect(MG + 4, by, CW - 4, 26).fill();
      this.doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica-Bold');
      this.doc.text(d.label, MG + 16, by + 6);
      // Grade badge circle
      const bx = MG + CW - 44;
      this.doc.fillColor('#ffffff').circle(bx + 10, by + 13, 10).fill();
      this.doc.fillColor(GRADE_BADGE_COLORS[gi]).fontSize(9).font('Helvetica-Bold');
      this.doc.text(`G${g}`, bx + 3, by + 6, { width: 14, align: 'center' });

      // Points line
      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
      this.doc.text(`${p}/${d.max} pts — ${desc}`, MG + 16, by + 33, { width: CW - 60 });

      // Justification header
      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.primary);
      this.doc.text('Fundamentacion:', MG + 16, by + 48);

      // Evidencia sections
      this.doc.fontSize(8.5).font('Helvetica').fillColor(C.text);
      this.doc.text(just, MG + 16, by + 62, justOpts);
      this.y = by + maxCard + 8;
    }
  }

  private addConclusion(evaluacion: any, totalPuntos: number, procedimientos?: ProcedimientosContext): void {
    this.checkPage(80);
    this.addSectionTitle('6. Conclusion y Dictamen Tecnico');
    const pct = Math.round((totalPuntos / 1000) * 100);
    const clase = getClaseSugerida(totalPuntos);
    let cat = '', desc = '';
    if (pct <= 20) { cat = 'Nivel Operativo Basico'; desc = 'Puesto con funciones simples, supervision minima o nula, y baja responsabilidad institucional.'; }
    else if (pct <= 35) { cat = 'Nivel Operativo Calificado'; desc = 'Puesto con funciones estandarizadas, supervision ocasional y responsabilidad moderada.'; }
    else if (pct <= 50) { cat = 'Nivel Tecnico-Administrativo'; desc = 'Puesto que requiere analisis tecnico, supervision de grupos y manejo de informacion sensible.'; }
    else if (pct <= 65) { cat = 'Nivel Profesional'; desc = 'Puesto con alta complejidad tecnica, jefatura de unidad y responsabilidad por presupuestos.'; }
    else if (pct <= 80) { cat = 'Nivel Directivo'; desc = 'Puesto de direccion estrategica, toma de decisiones criticas y gestion de procesos clave.'; }
    else { cat = 'Nivel Superior / Alta Direccion'; desc = 'Puesto de maxima responsabilidad institucional y direccion estrategica integral.'; }

    // Score banner
    this.checkPage(50);
    this.doc.rect(MG, this.y, CW, 46).fill(C.surface);
    this.doc.rect(MG, this.y, 4, 46).fill(C.accent);
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('PUNTUACION TOTAL', MG + 16, this.y + 5);
    this.doc.fillColor(C.primary).fontSize(20).font('Helvetica-Bold');
    this.doc.text(`${totalPuntos} / 1000`, MG + 16, this.y + 18);
    this.doc.fillColor(C.muted).fontSize(10).font('Helvetica');
    this.doc.text(`${pct}%`, MG + CW - 52, this.y + 20);
    this.y += 56;

    if (clase) {
      this.checkPage(40);
      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
      this.doc.text('CLASE MUNICIPAL SUGERIDA', MG, this.y);
      this.y += 11;
      this.doc.fillColor(C.accent).fontSize(12).font('Helvetica-Bold');
      this.doc.text(clase.nombre, MG, this.y);
      this.y += 16;
      this.doc.fillColor(C.muted).fontSize(8.5).font('Helvetica');
      this.doc.text(`Serie: ${clase.serie}`, MG, this.y);
      this.y += 14;
      if (clase.nombre.includes('(Prohib.)')) {
        this.doc.fillColor('#dc2626').fontSize(8).font('Helvetica-Oblique');
        this.doc.text('Nota: Clase restringida (Prohib.). Validar con el departamento de RRHH.', MG, this.y, { width: CW });
        this.y += 10;
      }
    }

    this.checkPage(40);
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text(`CATEGORIA ASIGNADA: ${cat}`, MG, this.y);
    this.y += 12;
    this.doc.fillColor(C.text).fontSize(9).font('Helvetica');
    const dh = this.doc.heightOfString(desc, { width: CW, align: 'justify' });
    this.doc.text(desc, MG, this.y, { width: CW, align: 'justify' });
    this.y += dh + 12;

    this.checkPage(40);
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('DICTAMEN TECNICO', MG, this.y);
    this.y += 12;

    const motorTexto = !evaluacion.motor || evaluacion.motor === 'rule-based' ? 'motor de analisis contextual' : 'agente de inteligencia artificial';
    const base = `El puesto "${evaluacion.puesto?.nombre || ''}" fue evaluado mediante la metodologia MSC de Puntos por Factores, obteniendo ${totalPuntos}/1000 pts (${pct}% del maximo).`;
    const ctxt = clase ? ` Con base en esta puntuacion, se sugiere su clasificacion en la clase "${clase.nombre}" (serie ${clase.serie}).` : '';
    const motor = ` El analisis fue ejecutado por ${motorTexto}${evaluacion.buildVersion ? ` (${evaluacion.buildVersion})` : ''}, garantizando la objetividad y trazabilidad del proceso.`;
    const proc = procedimientos ? ` Se consideraron ${procedimientos.totalProcedimientos} procedimientos operativos asociados al area como contexto adicional para la evaluacion.` : '';
    const dtxt = `${base}${ctxt}${motor}${proc}`;
    this.doc.fillColor(C.text).fontSize(9).font('Helvetica');
    const dxh = this.doc.heightOfString(dtxt, { width: CW, align: 'justify', lineGap: 2 });
    this.doc.text(dtxt, MG, this.y, { width: CW, align: 'justify', lineGap: 2 });
    this.y += dxh + 14;

    this.checkPage(30);
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('RECOMENDACIONES', MG, this.y);
    this.y += 12;

    let rec = '';
    if (pct < 30) rec = 'Se recomienda revisar la descripcion de funciones para asegurar que refleje adecuadamente todas las responsabilidades del puesto. Evaluar la posibilidad de ajuste salarial conforme a la categoria asignada.';
    else if (pct < 50) rec = 'Se recomienda formalizar los procedimientos operativos asociados al puesto y evaluar la consistencia salarial con puestos de categoria similar en la institucion.';
    else if (pct < 70) rec = 'Se recomienda realizar un analisis de mercado salarial para validar la competitividad de la categoria asignada. Documentar formalmente las funciones criticas del puesto.';
    else rec = 'Se recomienda asegurar que el puesto cuenta con las condiciones laborales y compensaciones adecuadas a su nivel de responsabilidad. Revisar la coherencia jerarquica con otros puestos de la institucion.';

    this.doc.fillColor(C.text).fontSize(9).font('Helvetica');
    const rh = this.doc.heightOfString(rec, { width: CW, align: 'justify' });
    this.doc.text(rec, MG, this.y, { width: CW, align: 'justify' });
    this.y += rh + 14;
  }

  private addSignature(evaluacion: any): void {
    this.checkPage(120);
    this.y = Math.max(this.y, MAX_Y - 130);
    this.doc.rect(MG, this.y, CW, 1).fill(C.border);
    this.y += 10;
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('FIRMA DIGITAL DEL SISTEMA', MG, this.y, { align: 'center' });
    this.y += 12;
    const rows: [string, string][] = [
      ['Generado por', 'Agente Evaluador IA — Sistema Integral RRHH'],
      ['Fecha de emision', evaluacion.fecha_evaluacion ? new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Periodo evaluado', evaluacion.periodo || new Date().getFullYear().toString()],
      ['Version del informe', `v${evaluacion.version || '1'} — Generado automaticamente`],
    ];
    for (const [l, v] of rows) {
      this.doc.fontSize(8).font('Helvetica').fillColor(C.muted);
      this.doc.text(l, MG, this.y);
      this.y += 8;
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor(C.text);
      this.doc.text(v, MG, this.y);
      this.y += 13;
    }
    this.y += 6;
    this.doc.fontSize(7).font('Helvetica-Oblique').fillColor('#94a3b8');
    this.doc.text('Este informe fue generado automaticamente por el Agente Evaluador IA. Los resultados se basan en el analisis objetivo de la descripcion de funciones del puesto segun la metodologia MSC de Puntos por Factores.', MG, this.y, { width: CW, align: 'center' });
  }

  generate(evaluacion: any): PDFKit.PDFDocument {
    const puesto = evaluacion.puesto || {};
    const totalPuntos = evaluacion.puntos_totales || 0;
    const procedimientos: ProcedimientosContext | undefined = evaluacion._procedimientos;

    this.addHeader();
    this.addSectionTitle('1. Datos del Puesto Evaluado');
    this.addField('Nombre del Puesto', puesto.nombre);
    this.addField('Area / Departamento', puesto.area);
    this.addField('Reporta a', puesto.reporta_a);
    this.addFunctionsBlock('Descripcion de Funciones', puesto.descripcion_funciones);
    this.addField('Requisitos Academicos', puesto.educacion_requerida);
    this.addField('Experiencia Requerida', puesto.experiencia_requerida);

    this.addSectionTitle('2. Metodologia Aplicada');
    const metText = 'La valoracion se realizo mediante el metodo MSC de Puntos por Factores, ' +
      'evaluando seis factores ponderados: Dificultad de Funciones (200 pts max.), Supervision Ejercida (150 pts max.), ' +
      'Responsabilidad (200 pts max.), Condiciones de Trabajo (100 pts max.), Consecuencia del Error (150 pts max.), ' +
      'y Requisitos (200 pts max.). La puntuacion maxima posible es de 1000 puntos. ' +
      'Cada factor se califica en una escala del 1 al 5, donde 1 representa el nivel minimo y 5 el nivel maximo. ' +
      'El analisis fue realizado por el Agente Evaluador IA, que aplica un proceso sistemico de evaluacion tecnica ' +
      'considerando la naturaleza y complejidad de las funciones descritas, el contexto organizacional del puesto, ' +
      'el nivel de autonomia y juicio requerido, y el impacto de sus decisiones en la institucion. ' +
      'Cada grado asignado se sustenta con evidencia textual de la descripcion de funciones y, cuando estan disponibles, ' +
      'de los procedimientos operativos asociados al area del puesto.' +
      (procedimientos ? ` Para este analisis se incorporaron ${procedimientos.totalProcedimientos} procedimientos operativos asociados al area como contexto adicional.` : '');
    const metOpts = { width: CW, align: 'justify' as const, lineGap: 2 };
    const mh = this.doc.heightOfString(metText, metOpts);
    this.doc.fontSize(9).font('Helvetica').fillColor(C.text);
    this.doc.text(metText, MG, this.y, metOpts);
    this.y += mh + 10;

    if (procedimientos) this.addProcedimientosBlock(procedimientos);
    this.addSectionTitle('4. Resumen de Puntuacion');
    this.addFactorsTable(evaluacion);
    this.addFactorDetail(evaluacion);
    this.addConclusion(evaluacion, totalPuntos, procedimientos);
    this.addSignature(evaluacion);
    this.doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
    this.doc.text('— Fin del Informe —', MG, this.y, { align: 'center' });
    return this.doc;
  }
}

export function generateEvaluationReport(evaluacion: any, procedimientos?: ProcedimientosContext): PDFKit.PDFDocument {
  const gen = new ReportGenerator();
  if (procedimientos) evaluacion._procedimientos = procedimientos;
  return gen.generate(evaluacion);
}
