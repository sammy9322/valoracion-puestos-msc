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

const FACTOR_DISPLAY: Record<string, { label: string; gradoField: string; justField: string }> = {
  dificultad: { label: 'Dificultad de Funciones', gradoField: 'grado_dificultad', justField: 'justif_dificultad' },
  supervision: { label: 'Supervisión Ejercida', gradoField: 'grado_supervision', justField: 'justif_supervision' },
  responsabilidad: { label: 'Responsabilidad', gradoField: 'grado_responsabilidad', justField: 'justif_responsabilidad' },
  condiciones: { label: 'Condiciones de Trabajo', gradoField: 'grado_condiciones', justField: 'justif_condiciones' },
  error: { label: 'Consecuencia del Error', gradoField: 'grado_consecuencia_error', justField: 'justif_consecuencia_error' },
  requisitos: { label: 'Requisitos', gradoField: 'grado_requisitos', justField: 'justif_requisitos' }
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
const GRADE_BG = ['#f1f5f9', '#eff6ff', '#ecfeff', '#f5f3ff', '#ecfdf5'];

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

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const MAX_Y = PAGE_HEIGHT - MARGIN;
const C = { primary: '#1e3a5f', secondary: '#0ea5e9', accent: '#047857', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', surface: '#f8fafc' };

class ReportGenerator {
  private doc: typeof PDFDocument.prototype;
  private y: number;
  private pageNum: number = 0;

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4', margin: MARGIN,
      info: { Title: 'Informe Tecnico de Valoracion de Puestos', Author: 'Agente Evaluador IA - Municipalidad de San Carlos', Subject: 'Valoracion Salarial - Metodologia MSC', Creator: 'Sistema Integral RRHH' }
    });
    this.y = MARGIN;
  }

  private checkPage(needed: number = 80): void {
    if (this.y > MAX_Y - needed) { this.doc.addPage(); this.y = MARGIN; this.pageNum++; this.addFooter(); }
  }

  private moveDown(space: number): void { this.y += space; this.checkPage(); }

  private addFooter(): void {
    this.doc.fontSize(7).font('Helvetica').fillColor('#94a3b8');
    this.doc.text(`Pagina ${this.pageNum}`, MARGIN, PAGE_HEIGHT - 30, { align: 'center' });
  }

  private addHeader(): void {
    this.doc.rect(0, 0, PAGE_WIDTH, 62).fill(C.primary);
    this.doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold');
    this.doc.text('Municipalidad de San Carlos', MARGIN, 14, { align: 'center' });
    this.doc.fontSize(9).font('Helvetica');
    this.doc.text('Sistema Integral de RRHH — Valoracion de Puestos', MARGIN, 33, { align: 'center' });
    this.doc.fontSize(8).font('Helvetica-Oblique');
    this.doc.text('Metodologia MSC — Puntos por Factores', MARGIN, 47, { align: 'center' });
    this.doc.rect(0, 62, PAGE_WIDTH, 3).fill(C.secondary);
    this.y = 74;
    this.pageNum = 1;
    this.addFooter();
  }

  private addSectionTitle(title: string): void {
    this.checkPage(30);
    this.doc.rect(MARGIN, this.y, CONTENT_WIDTH, 20).fill(C.surface);
    this.doc.rect(MARGIN, this.y, 4, 20).fill(C.secondary);
    this.doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primary);
    this.doc.text(title, MARGIN + 14, this.y + 3);
    this.y += 26;
  }

  private addField(label: string, value: string): void {
    this.checkPage(18);
    this.doc.fontSize(7).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text(label, MARGIN, this.y);
    this.y += 7;
    this.doc.fontSize(8.5).font('Helvetica').fillColor(C.text);
    this.doc.text(value || 'No especificado', MARGIN, this.y);
    this.y += 11;
  }

  private addFunctionsBlock(label: string, text: string): void {
    const opts = { width: CONTENT_WIDTH, align: 'justify' as const, lineGap: 1 };
    this.doc.fontSize(7).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text(label, MARGIN, this.y);
    this.y += 7;
    this.doc.fontSize(7.5).font('Helvetica').fillColor(C.text);
    const t = text || 'No especificado';
    const h = this.doc.heightOfString(t, opts);
    this.checkPage(h + 24);
    this.doc.text(t, MARGIN, this.y, opts);
    this.y += h + 4;
  }

  private addProcedimientosBlock(procedimientos: ProcedimientosContext): void {
    this.addSectionTitle('3. Contexto Operativo');
    this.doc.fontSize(7.5).font('Helvetica').fillColor(C.muted);
    const intro = `Se identificaron ${procedimientos.totalProcedimientos} procedimientos asociados al area del puesto.`;
    this.doc.text(intro, MARGIN, this.y, { width: CONTENT_WIDTH });
    this.y += 10;
    for (const proc of procedimientos.procedimientos) {
      this.checkPage(24);
      this.doc.rect(MARGIN, this.y, CONTENT_WIDTH, 0.5).fill(C.border);
      this.y += 4;
      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.primary);
      this.doc.text(`${proc.nombre} (${proc.codigo})`, MARGIN, this.y);
      this.y += 9;
      if (proc.proposito) {
        this.doc.fontSize(7).font('Helvetica').fillColor(C.text);
        const ph = this.doc.heightOfString(proc.proposito, { width: CONTENT_WIDTH, align: 'justify' });
        this.doc.text(proc.proposito, MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify' });
        this.y += ph + 3;
      }
    }
  }

  private addFactorsTable(evaluacion: any): void {
    this.checkPage(100);
    const colW = [170, 70, 70, 90]; const rh = 22;
    let total = 0;
    const rows = FACTORS.map(f => {
      const d = FACTOR_DISPLAY[f]; const g = evaluacion[d.gradoField] || 1; const p = POINTS_MAP[f][g] || 0;
      total += p; return { label: d.label, grado: g, puntos: p, pct: Math.round(p / 200 * 100) };
    });
    const hh = this.y;

    const hdr = ['Factor', 'Grado', 'Pts', '% Max'];
    let cx = MARGIN;
    this.doc.rect(MARGIN, hh, CONTENT_WIDTH, rh).fill(C.primary);
    for (let i = 0; i < colW.length; i++) {
      this.doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      this.doc.text(hdr[i], cx + 6, hh + 6, { width: colW[i] - 12, align: i === 0 ? 'left' : 'center' });
      cx += colW[i];
    }
    this.y = hh + rh;

    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]; const isEven = ri % 2 === 0;
      this.checkPage(rh + 10);
      cx = MARGIN;
      const ry = this.y;
      this.doc.fillColor(isEven ? C.surface : '#ffffff').rect(cx, ry, CONTENT_WIDTH, rh).fill();
      const vals = [row.label, `G${row.grado}`, `${row.puntos}`, `${row.pct}%`];
      for (let i = 0; i < colW.length; i++) {
        this.doc.fillColor(C.text).fontSize(7.5).font('Helvetica');
        this.doc.text(vals[i], cx + 6, ry + 6, { width: colW[i] - 12, align: i === 0 ? 'left' : 'center' });
        if (i === 3) {
          const barW = (colW[i] - 20) * row.pct / 100;
          if (barW > 3) {
            this.doc.fillColor(GRADE_COLORS[row.grado - 1]);
            this.doc.rect(cx + 8, ry + 16, Math.max(barW, 4), 3).fill();
          }
        }
        cx += colW[i];
      }
      this.y += rh;
    }

    this.doc.rect(MARGIN, this.y, CONTENT_WIDTH, 1).fill(C.primary);
    this.y += 5;
    this.doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primary);
    this.doc.text(`TOTAL: ${total} / 1000 pts`, MARGIN, this.y);
    this.y += 18;
  }

  private addFactorDetail(evaluacion: any): void {
    this.checkPage(50);
    this.addSectionTitle('5. Detalle Tecnico por Factor');
    for (const factor of FACTORS) {
      const d = FACTOR_DISPLAY[factor]; const g = evaluacion[d.gradoField] || 1;
      const p = POINTS_MAP[factor][g] || 0; const just = evaluacion[d.justField] || '';
      const desc = GRADES_DESC[factor]?.[g - 1] || '';
      const justOpts = { width: CONTENT_WIDTH - 28, align: 'justify' as const, lineGap: 1 };
      const jh = this.doc.heightOfString(just, justOpts);
      const cardH = Math.max(jh + 50, 56);
      this.checkPage(cardH + 16);
      const by = this.y;
      // Left accent bar
      this.doc.fillColor(GRADE_COLORS[g - 1]);
      this.doc.rect(MARGIN, by, 4, cardH).fill();
      // White background
      this.doc.fillColor('#ffffff').rect(MARGIN + 4, by, CONTENT_WIDTH - 4, cardH).fill();
      // Top border
      this.doc.fillColor(C.border).rect(MARGIN + 4, by, CONTENT_WIDTH - 4, 1).fill();
      // Title
      this.doc.fillColor(C.primary).fontSize(8.5).font('Helvetica-Bold');
      this.doc.text(d.label, MARGIN + 14, by + 5);
      // Grade circle badge
      const bx = MARGIN + CONTENT_WIDTH - 42, bc = by + 4;
      this.doc.fillColor(GRADE_COLORS[g - 1]).circle(bx, bc + 9, 12).fill();
      this.doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      this.doc.text(`G${g}`, bx - 6, bc + 3, { width: 12, align: 'center' });
      // Points + description
      this.doc.fontSize(7).font('Helvetica').fillColor(C.muted);
      this.doc.text(`${p} pts — ${desc}`, MARGIN + 14, by + 20, { width: CONTENT_WIDTH - 68 });
      // Justification
      this.doc.fontSize(7).font('Helvetica').fillColor(C.text);
      this.doc.text(just, MARGIN + 14, by + 34, justOpts);
      this.y = by + cardH + 5;
    }
  }

  private addConclusion(evaluacion: any, totalPuntos: number, procedimientos?: ProcedimientosContext): void {
    this.checkPage(100);
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

    // Puntuacion card
    this.doc.rect(MARGIN, this.y, CONTENT_WIDTH, 40).fill(C.surface);
    this.doc.rect(MARGIN, this.y, 4, 40).fill(C.accent);
    this.doc.fontSize(7).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('PUNTUACION TOTAL', MARGIN + 14, this.y + 5);
    this.doc.fillColor(C.primary).fontSize(16).font('Helvetica-Bold');
    this.doc.text(`${totalPuntos} / 1000`, MARGIN + 14, this.y + 16);
    this.doc.fillColor(C.muted).fontSize(8).font('Helvetica');
    this.doc.text(`${pct}%`, MARGIN + CONTENT_WIDTH - 46, this.y + 16);
    this.y += 48;

    if (clase) {
      this.checkPage(40);
      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
      this.doc.text('CLASE MUNICIPAL SUGERIDA', MARGIN, this.y);
      this.y += 10;
      this.doc.fillColor(C.accent).fontSize(11).font('Helvetica-Bold');
      this.doc.text(clase.nombre, MARGIN, this.y);
      this.y += 14;
      this.doc.fillColor(C.muted).fontSize(8).font('Helvetica');
      this.doc.text(`Serie: ${clase.serie}`, MARGIN, this.y);
      this.y += 12;
      if (clase.nombre.includes('(Prohib.)')) {
        this.doc.fillColor('#dc2626').fontSize(7.5).font('Helvetica-Oblique');
        this.doc.text('Nota: Clase restringida (Prohib.). Validar con el departamento de RRHH.', MARGIN, this.y, { width: CONTENT_WIDTH });
        this.y += 10;
      }
    }

    this.checkPage(40);
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('CATEGORIA ASIGNADA', MARGIN, this.y);
    this.y += 10;
    this.doc.fillColor(C.accent).fontSize(10).font('Helvetica-Bold');
    this.doc.text(cat, MARGIN, this.y);
    this.y += 16;
    this.doc.fillColor(C.text).fontSize(8).font('Helvetica');
    const dh = this.doc.heightOfString(desc, { width: CONTENT_WIDTH, align: 'justify' });
    this.doc.text(desc, MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify' });
    this.y += dh + 10;

    this.checkPage(40);
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('DICTAMEN TECNICO', MARGIN, this.y);
    this.y += 10;

    const motorTexto = !evaluacion.motor || evaluacion.motor === 'rule-based' ? 'motor de analisis basado en reglas contextuales' : 'agente de inteligencia artificial';
    const base = `El puesto "${evaluacion.puesto?.nombre || ''}" fue evaluado mediante la metodologia MSC de Puntos por Factores, obteniendo ${totalPuntos}/1000 pts (${pct}%).`;
    const ctxt = clase ? ` Se sugiere su clasificacion en "${clase.nombre}" (serie ${clase.serie}).` : '';
    const motor = ` Analisis ejecutado por ${motorTexto}${evaluacion.buildVersion ? ` (${evaluacion.buildVersion})` : ''}.`;
    const proc = procedimientos ? ` Se consideraron ${procedimientos.totalProcedimientos} procedimientos operativos asociados.` : '';
    this.doc.fillColor(C.text).fontSize(7.5).font('Helvetica');
    const dtxt = `${base}${ctxt}${motor}${proc}`;
    const dxh = this.doc.heightOfString(dtxt, { width: CONTENT_WIDTH, align: 'justify', lineGap: 1 });
    this.doc.text(dtxt, MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify', lineGap: 1 });
    this.y += dxh + 8;

    this.checkPage(30);
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('RECOMENDACIONES', MARGIN, this.y);
    this.y += 10;

    let rec = '';
    if (pct < 30) rec = 'Revisar la descripcion de funciones para asegurar que refleje todas las responsabilidades del puesto. Evaluar ajuste salarial conforme a la categoria asignada.';
    else if (pct < 50) rec = 'Formalizar los procedimientos operativos asociados y evaluar la consistencia salarial con puestos de categoria similar.';
    else if (pct < 70) rec = 'Realizar un analisis de mercado salarial para validar la competitividad de la categoria. Documentar formalmente las funciones criticas del puesto.';
    else rec = 'Asegurar condiciones laborales y compensaciones adecuadas al nivel de responsabilidad. Revisar coherencia jerarquica con otros puestos.';

    this.doc.fillColor(C.text).fontSize(7.5).font('Helvetica');
    const rh = this.doc.heightOfString(rec, { width: CONTENT_WIDTH, align: 'justify' });
    this.doc.text(rec, MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify' });
    this.y += rh + 8;
  }

  private addSignature(evaluacion: any): void {
    this.checkPage(120);
    this.y = Math.max(this.y, MAX_Y - 130);
    this.doc.rect(MARGIN, this.y, CONTENT_WIDTH, 1).fill(C.border);
    this.y += 8;
    this.doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('FIRMA DIGITAL DEL SISTEMA', MARGIN, this.y, { align: 'center' });
    this.y += 10;
    const rows: [string, string][] = [
      ['Generado por', 'Agente Evaluador IA — Sistema Integral RRHH'],
      ['Fecha de emision', evaluacion.fecha_evaluacion ? new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Periodo evaluado', evaluacion.periodo || new Date().getFullYear().toString()],
      ['Version del informe', `v${evaluacion.version || '1'} — Generado automaticamente`],
    ];
    for (const [l, v] of rows) {
      this.doc.fontSize(7).font('Helvetica').fillColor(C.muted);
      this.doc.text(l, MARGIN, this.y);
      this.y += 6;
      this.doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.text);
      this.doc.text(v, MARGIN, this.y);
      this.y += 10;
    }
    this.y += 6;
    this.doc.fontSize(6.5).font('Helvetica-Oblique').fillColor('#94a3b8');
    this.doc.text('Este informe fue generado automaticamente por el Agente Evaluador IA. Los resultados se basan en el analisis objetivo de la descripcion de funciones del puesto segun la metodologia MSC de Puntos por Factores.', MARGIN, this.y, { width: CONTENT_WIDTH, align: 'center' });
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
    const metodologiaText = 'La valoracion se realizo mediante el metodo MSC de Puntos por Factores, ' +
      'evaluando seis factores ponderados: Dificultad de Funciones (200 pts max.), Supervision Ejercida (150 pts max.), ' +
      'Responsabilidad (200 pts max.), Condiciones de Trabajo (100 pts max.), Consecuencia del Error (150 pts max.), ' +
      'y Requisitos (200 pts max.). La puntuacion maxima es de 1000 puntos. ' +
      'Cada factor se califica en escala del 1 al 5. ' +
      'El analisis fue realizado por el Agente Evaluador IA, que aplica un proceso sistemico de evaluacion tecnica ' +
      'considerando: (a) la naturaleza y complejidad de las funciones descritas, (b) el contexto organizacional del puesto, ' +
      '(c) el nivel de autonomia y juicio requerido, y (d) el impacto de sus decisiones en la institucion. ' +
      'Cada grado asignado se sustenta con evidencia textual de la descripcion de funciones y, cuando estan disponibles, ' +
      'de los procedimientos operativos asociados al area del puesto.' +
      (procedimientos
        ? ` Para este analisis se incorporaron ${procedimientos.totalProcedimientos} procedimientos operativos asociados al area del puesto como contexto adicional, permitiendo una evaluacion mas precisa.`
        : '');
    const metOpts = { width: CONTENT_WIDTH, align: 'justify' as const, lineGap: 1 };
    const mh = this.doc.heightOfString(metodologiaText, metOpts);
    this.doc.fontSize(7.5).font('Helvetica').fillColor(C.text);
    this.doc.text(metodologiaText, MARGIN, this.y, metOpts);
    this.y += mh + 8;

    if (procedimientos) this.addProcedimientosBlock(procedimientos);
    this.addSectionTitle('4. Resumen de Puntuacion');
    this.addFactorsTable(evaluacion);
    this.addFactorDetail(evaluacion);
    this.addConclusion(evaluacion, totalPuntos, procedimientos);
    this.addSignature(evaluacion);
    this.doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
    this.doc.text('— Fin del Informe —', MARGIN, this.y, { align: 'center' });
    return this.doc;
  }
}

export function generateEvaluationReport(evaluacion: any, procedimientos?: ProcedimientosContext): PDFKit.PDFDocument {
  const gen = new ReportGenerator();
  if (procedimientos) evaluacion._procedimientos = procedimientos;
  return gen.generate(evaluacion);
}
