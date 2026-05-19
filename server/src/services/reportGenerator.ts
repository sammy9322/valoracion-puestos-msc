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

const FACTOR_DISPLAY: Record<string, { label: string; max: number }> = {
  dificultad: { label: 'Dificultad de Funciones', max: 200 },
  supervision: { label: 'Supervision Ejercida', max: 150 },
  responsabilidad: { label: 'Responsabilidad', max: 200 },
  condiciones: { label: 'Condiciones de Trabajo', max: 100 },
  error: { label: 'Consecuencia del Error', max: 150 },
  requisitos: { label: 'Requisitos', max: 200 },
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

const PW = 595.28, PH = 841.89, MG = 56, CW = PW - MG * 2;
const MAX_Y = PH - MG - 22; // 764

const C = { text: '#0f172a', muted: '#64748b', border: '#e2e8f0', hrule: '#cbd5e1', accent: '#1e3a5f' };

function g(gv: number): number { return Math.max(1, Math.min(5, gv)); }

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
  const np = ESTRATOS_MUNICIPALES
    .filter(e => e.puntos <= puntos && !e.nombre.includes('(Prohib.)'))
    .sort((a, b) => b.puntos - a.puntos);
  if (np.length) return np[0];
  const pr = ESTRATOS_MUNICIPALES.filter(e => e.puntos <= puntos).sort((a, b) => b.puntos - a.puntos);
  return pr[0] || null;
}

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

  private checkPage(needed: number = 60): void {
    if (this.y + needed > MAX_Y) {
      this.doc.addPage();
      this.pageNum++;
      this.addRunningHeader();
      this.y = 26;
    }
  }

  private addRunningHeader(): void {
    this.doc.fontSize(8).font('Helvetica').fillColor(C.muted);
    this.doc.text('Municipalidad de San Carlos — Valoracion MSC', MG, 8);
    this.doc.text(String(this.pageNum), MG + CW - 16, 8, { width: 16, align: 'right' });
    this.doc.fillColor(C.hrule).rect(MG, 18, CW, 0.5).fill();
  }

  private addTitleHeader(): void {
    this.doc.rect(0, 0, PW, 56).fill(C.accent);
    this.doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold');
    this.doc.text('Municipalidad de San Carlos', MG, 10, { align: 'center' });
    this.doc.fontSize(9).font('Helvetica');
    this.doc.text('Sistema Integral de RRHH — Valoracion de Puestos', MG, 30, { align: 'center' });
    this.doc.fontSize(8).font('Helvetica-Oblique');
    this.doc.text('Metodologia MSC — Puntos por Factores', MG, 44, { align: 'center' });
    this.y = 68;
    this.pageNum = 1;
    this.addRunningHeader();
    this.y = 74;
  }

  private addSectionTitle(title: string): void {
    this.checkPage(26);
    this.doc.fontSize(12).font('Helvetica-Bold').fillColor(C.text);
    this.doc.text(title, MG, this.y);
    this.y += 3;
    this.doc.fillColor(C.hrule).rect(MG, this.y, CW, 0.5).fill();
    this.y += 12;
  }

  private addField(label: string, value: string): void {
    if (!value) value = 'No especificado';
    this.checkPage(20);
    this.doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text(label, MG, this.y);
    this.y += 9;
    this.doc.fontSize(10).font('Helvetica').fillColor(C.text);
    const vh = this.doc.heightOfString(value, { width: CW });
    this.doc.text(value, MG, this.y, { width: CW });
    this.y += vh + 4;
  }

  private addFunctionsBlock(label: string, text: string): void {
    const opts = { width: CW, align: 'justify' as const, lineGap: 3 };
    if (!text) text = 'No especificado';
    this.checkPage(22);
    this.doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text(label, MG, this.y);
    this.y += 10;
    this.doc.fontSize(10).font('Helvetica').fillColor(C.text);
    const h = this.doc.heightOfString(text, opts);
    this.checkPage(h + 6);
    this.doc.text(text, MG, this.y, opts);
    this.y += h + 6;
  }

  private addProcedimientosBlock(procedimientos: ProcedimientosContext): void {
    this.addSectionTitle('3. Contexto Operativo (Procedimientos Asociados)');
    this.checkPage(16);
    this.doc.fontSize(10).font('Helvetica').fillColor(C.text);
    this.doc.text(`Se identificaron ${procedimientos.totalProcedimientos} procedimientos operativos asociados al area del puesto.`, MG, this.y, { width: CW });
    this.y += 14;
    for (const proc of procedimientos.procedimientos) {
      this.checkPage(26);
      this.doc.fontSize(10).font('Helvetica-Bold').fillColor(C.accent);
      this.doc.text(`${proc.nombre} (${proc.codigo})`, MG, this.y);
      this.y += 12;
      if (proc.proposito) {
        this.doc.fontSize(10).font('Helvetica').fillColor(C.text);
        const ph = this.doc.heightOfString(proc.proposito, { width: CW, align: 'justify' });
        this.doc.text(proc.proposito, MG, this.y, { width: CW, align: 'justify' });
        this.y += ph + 6;
      }
    }
  }

  private addFactorsTable(evaluacion: any): void {
    const colW = [158, 42, 44, 44, 56];
    const rh = 22;
    const rows = FACTORS.map(f => {
      const d = FACTOR_DISPLAY[f];
      const gr = g(evaluacion[`grado_${f}`] || 1);
      const p = POINTS_MAP[f][gr] || 0;
      return { label: d.label, grado: gr, puntos: p, max: d.max, pct: Math.round(p / d.max * 100) };
    });
    const total = rows.reduce((s, r) => s + r.puntos, 0);
    const tPct = Math.round(total / 1000 * 100);
    const rcnt = rows.length + 2;
    const tableH = rh * rcnt;
    this.checkPage(tableH + 20);
    const by = this.y;
    const tw = colW.reduce((s, w) => s + w, 0);
    const lx = MG + (CW - tw) / 2;

    const drawRow = (ri: number, bg: string, vals: string[], bold: boolean, center: boolean[]) => {
      const rry = by + ri * rh;
      this.doc.fillColor(bg).rect(lx, rry, tw, rh).fill();
      this.doc.fillColor(C.text).fontSize(8.5).font(bold ? 'Helvetica-Bold' : 'Helvetica');
      let cx = lx;
      for (let ci = 0; ci < vals.length; ci++) {
        const a = ci === 0 && !center[ci] ? 'left' : 'center';
        this.doc.text(vals[ci], cx + 4, rry + 5, { width: colW[ci] - 8, align: a });
        cx += colW[ci];
      }
    };

    const centers = [false, true, true, true, true];
    drawRow(0, '#f1f5f9', ['Factor', 'Grado', 'Pts', 'Max', '%'], true, centers);
    for (let ri = 0; ri < rows.length; ri++) {
      const r = rows[ri];
      drawRow(1 + ri, ri % 2 === 0 ? '#ffffff' : '#f8fafc',
        [r.label, `G${r.grado}`, `${r.puntos}`, `${r.max}`, `${r.pct}%`], false, centers);
    }
    drawRow(1 + rows.length, '#f1f5f9', ['TOTAL', '', `${total}`, '1000', `${tPct}%`], true, centers);

    // Grid: horizontal lines between rows
    for (let i = 1; i < rcnt; i++) {
      this.doc.fillColor(C.border).rect(lx, by + i * rh, tw, 0.5).fill();
    }
    // Grid: vertical lines between columns
    let cx = lx;
    for (let ci = 0; ci < colW.length; ci++) {
      cx += colW[ci];
      this.doc.fillColor(C.border).rect(cx, by, 0.5, tableH).fill();
    }
    // Outer border
    this.doc.fillColor(C.border).rect(lx, by, tw, tableH).fill();
    this.doc.fillColor('#ffffff').rect(lx + 1, by + 1, tw - 2, tableH - 2).fill();
    // Redraw all rows on top of white fill
    drawRow(0, '#f1f5f9', ['Factor', 'Grado', 'Pts', 'Max', '%'], true, centers);
    for (let ri = 0; ri < rows.length; ri++) {
      const r = rows[ri];
      drawRow(1 + ri, ri % 2 === 0 ? '#ffffff' : '#f8fafc',
        [r.label, `G${r.grado}`, `${r.puntos}`, `${r.max}`, `${r.pct}%`], false, centers);
    }
    drawRow(1 + rows.length, '#f1f5f9', ['TOTAL', '', `${total}`, '1000', `${tPct}%`], true, centers);
    // Redraw grid on top
    for (let i = 1; i < rcnt; i++) {
      this.doc.fillColor(C.border).rect(lx, by + i * rh, tw, 0.5).fill();
    }
    cx = lx;
    for (let ci = 0; ci < colW.length; ci++) {
      cx += colW[ci];
      this.doc.fillColor(C.border).rect(cx, by, 0.5, tableH).fill();
    }

    this.y = by + tableH + 14;
  }

  private addFactorDetail(evaluacion: any): void {
    this.addSectionTitle('5. Detalle Tecnico por Factor');
    for (const factor of FACTORS) {
      const d = FACTOR_DISPLAY[factor];
      const gr = g(evaluacion[`grado_${factor}`] || 1);
      const p = POINTS_MAP[factor][gr] || 0;
      const just = (evaluacion[`justif_${factor}`] || '').trim();
      const desc = GRADES_DESC[factor]?.[gr - 1] || '';

      this.checkPage(28);

      this.doc.fontSize(10).font('Helvetica-Bold').fillColor(C.text);
      this.doc.text(d.label, MG, this.y);
      this.y += 10;

      this.doc.fontSize(8.5).font('Helvetica').fillColor(C.muted);
      const summary = `Grado ${gr}  ·  ${p}/${d.max} pts  ·  ${desc}`;
      this.doc.text(summary, MG, this.y, { width: CW });
      this.y += 3;
      this.doc.fillColor(C.hrule).rect(MG, this.y, CW, 0.5).fill();
      this.y += 8;

      if (just) {
        const lines = just.split('\n').filter((l: string) => l.trim());
        for (const line of lines) {
          this.checkPage(14);
          this.doc.fontSize(10).font('Helvetica').fillColor(C.text);
          this.doc.text(line, MG, this.y, { width: CW, align: 'justify', lineGap: 3 });
          this.y = this.doc.y + 2;
        }
        this.y += 4;
      }
    }
  }

  private addConclusion(evaluacion: any, totalPuntos: number, procedimientos?: ProcedimientosContext): void {
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

    this.checkPage(28);
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('PUNTUACION TOTAL', MG, this.y);
    this.y += 11;
    this.doc.fontSize(14).font('Helvetica-Bold').fillColor(C.accent);
    this.doc.text(`${totalPuntos} / 1000 pts`, MG, this.y);
    this.doc.fontSize(10).font('Helvetica').fillColor(C.muted);
    this.doc.text(`(${pct}%)`, MG + 116, this.y + 2);
    this.y += 24;

    if (clase) {
      this.checkPage(20);
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor(C.muted);
      this.doc.text('CLASE MUNICIPAL SUGERIDA', MG, this.y);
      this.y += 10;
      this.doc.fontSize(10).font('Helvetica-Bold').fillColor(C.text);
      this.doc.text(clase.nombre, MG, this.y);
      this.doc.fontSize(8.5).font('Helvetica').fillColor(C.muted);
      this.doc.text(`Serie: ${clase.serie}`, MG + 220, this.y, { width: CW - 220 });
      this.y += 16;
    }

    this.checkPage(18);
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('CATEGORIA ASIGNADA', MG, this.y);
    this.y += 10;
    this.doc.fontSize(10).font('Helvetica-Bold').fillColor(C.text);
    this.doc.text(cat, MG, this.y);
    this.y += 12;
    this.doc.fontSize(10).font('Helvetica').fillColor(C.text);
    const dh = this.doc.heightOfString(desc, { width: CW, align: 'justify' });
    this.doc.text(desc, MG, this.y, { width: CW, align: 'justify' });
    this.y += dh + 14;

    this.checkPage(20);
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('DICTAMEN TECNICO', MG, this.y);
    this.y += 10;
    const motorTexto = !evaluacion.motor || evaluacion.motor === 'rule-based' ? 'motor de analisis contextual' : 'agente de inteligencia artificial';
    const base = `El puesto "${evaluacion.puesto?.nombre || ''}" fue evaluado mediante la metodologia MSC de Puntos por Factores, obteniendo ${totalPuntos}/1000 pts (${pct}% del maximo).`;
    const ctxt = clase ? ` Con base en esta puntuacion, se sugiere su clasificacion en la clase "${clase.nombre}" (serie ${clase.serie}).` : '';
    const motorS = ` El analisis fue ejecutado por ${motorTexto}${evaluacion.buildVersion ? ` (${evaluacion.buildVersion})` : ''}, garantizando la objetividad y trazabilidad del proceso.`;
    const proc = procedimientos ? ` Se consideraron ${procedimientos.totalProcedimientos} procedimientos operativos asociados al area como contexto adicional para la evaluacion.` : '';
    const dtxt = `${base}${ctxt}${motorS}${proc}`;
    this.doc.fontSize(10).font('Helvetica').fillColor(C.text);
    const dxh = this.doc.heightOfString(dtxt, { width: CW, align: 'justify', lineGap: 3 });
    this.doc.text(dtxt, MG, this.y, { width: CW, align: 'justify', lineGap: 3 });
    this.y += dxh + 14;

    this.checkPage(20);
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('RECOMENDACIONES', MG, this.y);
    this.y += 10;
    let rec = '';
    if (pct < 30) rec = 'Se recomienda revisar la descripcion de funciones para asegurar que refleje adecuadamente todas las responsabilidades del puesto. Evaluar la posibilidad de ajuste salarial conforme a la categoria asignada.';
    else if (pct < 50) rec = 'Se recomienda formalizar los procedimientos operativos asociados al puesto y evaluar la consistencia salarial con puestos de categoria similar en la institucion.';
    else if (pct < 70) rec = 'Se recomienda realizar un analisis de mercado salarial para validar la competitividad de la categoria asignada. Documentar formalmente las funciones criticas del puesto.';
    else rec = 'Se recomienda asegurar que el puesto cuenta con las condiciones laborales y compensaciones adecuadas a su nivel de responsabilidad. Revisar la coherencia jerarquica con otros puestos de la institucion.';
    this.doc.fontSize(10).font('Helvetica').fillColor(C.text);
    const rh = this.doc.heightOfString(rec, { width: CW, align: 'justify' });
    this.doc.text(rec, MG, this.y, { width: CW, align: 'justify' });
    this.y += rh + 14;

    if (clase && clase.nombre.includes('(Prohib.)')) {
      this.checkPage(14);
      this.doc.fontSize(8).font('Helvetica-Oblique').fillColor(C.muted);
      this.doc.text('Nota: Clase restringida (Prohib.). Verificar con el departamento de RRHH antes de formalizar.', MG, this.y, { width: CW });
      this.y += 10;
    }
  }

  private addSignature(evaluacion: any): void {
    this.checkPage(90);
    this.y = Math.max(this.y, MAX_Y - 90);
    this.doc.fillColor(C.hrule).rect(MG, this.y, CW, 0.5).fill();
    this.y += 10;
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('FIRMA DIGITAL DEL SISTEMA', MG, this.y, { align: 'center' });
    this.y += 12;
    const items: [string, string][] = [
      ['Generado por', 'Agente Evaluador IA — Sistema Integral RRHH'],
      ['Fecha de emision', evaluacion.fecha_evaluacion ? new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Periodo evaluado', evaluacion.periodo || new Date().getFullYear().toString()],
      ['Version del informe', `v${evaluacion.version || '1'} — Generado automaticamente`],
    ];
    for (const [l, v] of items) {
      this.doc.fontSize(8.5).font('Helvetica').fillColor(C.muted);
      this.doc.text(l, MG, this.y);
      this.y += 8;
      this.doc.fontSize(10).font('Helvetica').fillColor(C.text);
      this.doc.text(v, MG, this.y);
      this.y += 14;
    }
    this.y += 6;
    this.doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#94a3b8');
    this.doc.text('Este informe fue generado automaticamente por el Agente Evaluador IA. Los resultados se basan en el analisis objetivo de la descripcion de funciones del puesto segun la metodologia MSC de Puntos por Factores.', MG, this.y, { width: CW, align: 'center' });
  }

  generate(evaluacion: any): PDFKit.PDFDocument {
    const puesto = evaluacion.puesto || {};
    const totalPuntos = evaluacion.puntos_totales || 0;
    const procedimientos: ProcedimientosContext | undefined = evaluacion._procedimientos;

    this.addTitleHeader();
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
    const metOpts = { width: CW, align: 'justify' as const, lineGap: 3 };
    const mh = this.doc.heightOfString(metText, metOpts);
    this.doc.fontSize(10).font('Helvetica').fillColor(C.text);
    this.doc.text(metText, MG, this.y, metOpts);
    this.y += mh + 12;

    if (procedimientos) this.addProcedimientosBlock(procedimientos);
    this.addSectionTitle('4. Resumen de Puntuacion');
    this.addFactorsTable(evaluacion);
    this.addFactorDetail(evaluacion);
    this.addConclusion(evaluacion, totalPuntos, procedimientos);
    this.addSignature(evaluacion);
    this.doc.fontSize(8.5).font('Helvetica').fillColor('#94a3b8');
    this.doc.text('— Fin del Informe —', MG, this.y, { align: 'center' });
    return this.doc;
  }
}

export function generateEvaluationReport(evaluacion: any, procedimientos?: ProcedimientosContext): PDFKit.PDFDocument {
  const gen = new ReportGenerator();
  if (procedimientos) evaluacion._procedimientos = procedimientos;
  return gen.generate(evaluacion);
}
