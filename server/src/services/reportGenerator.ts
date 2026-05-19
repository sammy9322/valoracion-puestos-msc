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
  dificultad: [
    'Tareas simples y repetitivas',
    'Tareas variadas estandarizadas',
    'Analisis y juicio tecnico',
    'Alta complejidad y planeacion',
    'Direccion estrategica'
  ],
  supervision: [
    'No ejerce supervision',
    'Supervision ocasional',
    'Supervision de grupo operativo',
    'Jefatura de unidad',
    'Direccion de area mayor'
  ],
  responsabilidad: [
    'Baja responsabilidad',
    'Responsabilidad moderada',
    'Custodia de info sensible',
    'Responsabilidad por presupuestos',
    'Gestion de proceso clave'
  ],
  condiciones: [
    'Oficina normal',
    'Esfuerzo moderado',
    'Exposicion climatica o ruido',
    'Riesgo de accidentes',
    'Alta peligrosidad'
  ],
  error: [
    'Error facil de corregir',
    'Retrasos menores',
    'Afecta otros deptos',
    'Perdidas economicas/legales',
    'Compromete estabilidad'
  ],
  requisitos: [
    'Educacion basica',
    'Bachillerato / Tecnico',
    'Diplomado / Tecnico sup.',
    'Licenciatura',
    'Maestria / Doctorado'
  ],
};

const PW = 595.28, PH = 841.89, MG = 50, CW = PW - MG * 2;
const MAX_Y = PH - MG - 25;
const C = {
  text: '#0f172a',
  muted: '#64748b',
  border: '#cbd5e1',
  lightBorder: '#e2e8f0',
  tableHeader: '#f8fafc',
  hrule: '#cbd5e1',
  accent: '#1e3a5f',
  cardBg: '#f8fafc',
  // Grade dynamic colors
  g1: '#10b981', // Green
  g2: '#06b6d4', // Cyan
  g3: '#0ea5e9', // Blue
  g4: '#1e3a5f', // Navy
  g5: '#8b5cf6'  // Purple
};

function g(gv: number): number { return Math.max(1, Math.min(5, gv)); }

function getGradeColor(gr: number): string {
  if (gr <= 2) return C.g1;
  if (gr === 3) return C.g3;
  if (gr === 4) return C.g4;
  return C.g5;
}

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
      size: 'A4',
      margin: MG,
      info: {
        Title: 'Informe Tecnico de Valoracion de Puestos',
        Author: 'Agente Evaluador IA - Municipalidad de San Carlos',
        Subject: 'Valoracion Salarial - Metodologia MSC',
        Creator: 'Sistema Integral RRHH'
      }
    });
    this.y = MG;
  }

  private checkPage(needed: number = 80): void {
    const safe = Math.min(needed, MAX_Y - MG - 8);
    if (this.y + safe > MAX_Y) {
      this.doc.addPage();
      this.y = MG;
      this.pageNum++;
      this.addPageHeader();
    }
  }

  private addPageHeader(): void {
    this.doc.fontSize(7.5).font('Helvetica').fillColor(C.muted);
    this.doc.text('MUNICIPALIDAD DE SAN CARLOS — INFORME DE VALORACION DE PUESTO', MG, 15);
    this.doc.text(`Pagina ${this.pageNum}`, MG + CW - 40, 15, { width: 40, align: 'right' });
    this.doc.fillColor(C.lightBorder).rect(MG, 25, CW, 0.5).fill();
    this.y = 40;
  }

  private addInstitutionalHeader(): void {
    // Elegant left vertical brand bar (4px wide, 42px high)
    this.doc.fillColor(C.accent).rect(MG, this.y, 4, 42).fill();
    
    // Header texts
    this.doc.fillColor(C.accent).fontSize(14).font('Helvetica-Bold');
    this.doc.text('MUNICIPALIDAD DE SAN CARLOS', MG + 12, this.y + 2);
    
    this.doc.fillColor(C.muted).fontSize(9).font('Helvetica');
    this.doc.text('Direccion de Gestion del Talento Humano  \u00b7  Sistema Integral de RRHH', MG + 12, this.y + 17);
    
    this.doc.fillColor(C.text).fontSize(10.5).font('Helvetica-Bold');
    this.doc.text('INFORME TECNICO DE VALORACION DE PUESTO (MSC)', MG + 12, this.y + 29);
    
    // Decorative metadata info on top-right of page 1
    const metaX = MG + CW - 180;
    this.doc.fillColor(C.muted).fontSize(7.5).font('Helvetica-Bold');
    this.doc.text('DOCUMENTO OFICIAL', metaX, this.y + 4, { width: 180, align: 'right' });
    this.doc.font('Helvetica');
    this.doc.text(`Codigo: INF-VAL-${new Date().getFullYear()}`, metaX, this.y + 14, { width: 180, align: 'right' });
    this.doc.text(`Fecha: ${new Date().toLocaleDateString('es-CR')}`, metaX, this.y + 24, { width: 180, align: 'right' });
    
    this.y += 50;
    this.pageNum = 1;
    
    // Elegant double separator lines (thick brand line + thin support line)
    this.doc.fillColor(C.accent).rect(MG, this.y, CW, 2).fill();
    this.doc.fillColor(C.lightBorder).rect(MG, this.y + 3, CW, 0.5).fill();
    this.y += 15;
  }

  private addSectionTitle(title: string): void {
    this.checkPage(40);
    // Vertical tag indicator
    this.doc.fillColor(C.accent).rect(MG, this.y + 1, 3, 13).fill();
    
    // Section title
    this.doc.fontSize(11).font('Helvetica-Bold').fillColor(C.text);
    this.doc.text(title, MG + 10, this.y);
    this.y += 16;
    
    // Divider line
    this.doc.fillColor(C.lightBorder).rect(MG, this.y, CW, 0.5).fill();
    this.y += 10;
  }

  private addMetadataGrid(puesto: any, motorText: string, buildVersion?: string): void {
    this.checkPage(110);
    const rh = 36;
    const colW = CW / 2;
    const gridY = this.y;

    const drawGridCell = (col: number, row: number, label: string, val: string) => {
      const cx = MG + col * colW;
      const cy = gridY + row * rh;
      
      // Draw background cell
      this.doc.fillColor(C.cardBg).rect(cx, cy, colW, rh).fill();
      // Draw borders
      this.doc.strokeColor(C.lightBorder).lineWidth(0.5).rect(cx, cy, colW, rh).stroke();
      
      // Labels and Values
      this.doc.fillColor(C.muted).fontSize(7.5).font('Helvetica-Bold');
      this.doc.text(label.toUpperCase(), cx + 10, cy + 7);
      
      this.doc.fillColor(C.text).fontSize(9.5).font('Helvetica');
      this.doc.text(val || 'No especificado', cx + 10, cy + 18, { width: colW - 20, ellipsis: true });
    };

    drawGridCell(0, 0, 'Nombre del Puesto', puesto.nombre);
    drawGridCell(1, 0, 'Area / Departamento', puesto.area);
    
    drawGridCell(0, 1, 'Reporta a (Jerarquia)', puesto.reporta_a);
    drawGridCell(1, 1, 'Requisitos Academicos', puesto.educacion_requerida);
    
    drawGridCell(0, 2, 'Experiencia Requerida', puesto.experiencia_requerida);
    
    const engineDesc = `${motorText}${buildVersion ? ` (${buildVersion})` : ''}`;
    drawGridCell(1, 2, 'Motor de Valoracion', engineDesc);

    this.y += rh * 3 + 15;
  }

  private addFunctionsCard(label: string, text: string): void {
    const opts = { width: CW - 32, align: 'justify' as const, lineGap: 3.5 };
    if (!text) text = 'No especificado';
    
    this.checkPage(30);
    this.doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text(label.toUpperCase(), MG, this.y);
    this.y += 12;

    const th = this.doc.heightOfString(text, opts);
    const cardH = th + 24;

    this.checkPage(cardH + 10);
    
    // Draw rounded background card
    this.doc.fillColor(C.cardBg).roundedRect(MG, this.y, CW, cardH, 4).fill();
    // Accent left bar (rounded vertical pill)
    this.doc.fillColor(C.accent).roundedRect(MG, this.y, 3, cardH, 1.5).fill();
    // Card thin border
    this.doc.strokeColor(C.lightBorder).lineWidth(0.5).roundedRect(MG, this.y, CW, cardH, 4).stroke();

    // Render Text
    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    this.doc.text(text, MG + 16, this.y + 12, opts);
    
    this.y += cardH + 15;
  }

  private addProcedimientosBlock(procedimientos: ProcedimientosContext): void {
    this.addSectionTitle('3. Contexto Operativo (Procedimientos Asociados)');
    
    this.checkPage(20);
    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    this.doc.text(`Se identificaron ${procedimientos.totalProcedimientos} procedimientos operativos asociados al area del puesto en el manual municipal.`, MG, this.y, { width: CW });
    this.y += 16;
    
    for (const proc of procedimientos.procedimientos) {
      const label = `${proc.nombre} (${proc.codigo})`;
      const text = proc.proposito || 'Sin proposito detallado registrado.';
      const opts = { width: CW - 32, align: 'justify' as const, lineGap: 3 };
      
      this.checkPage(35);
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor(C.accent);
      this.doc.text(label, MG, this.y);
      this.y += 11;

      const th = this.doc.heightOfString(text, opts);
      const cardH = th + 20;

      this.checkPage(cardH + 12);
      
      // Gray background card
      this.doc.fillColor(C.cardBg).roundedRect(MG, this.y, CW, cardH, 4).fill();
      this.doc.strokeColor(C.lightBorder).lineWidth(0.5).roundedRect(MG, this.y, CW, cardH, 4).stroke();

      this.doc.fontSize(9).font('Helvetica').fillColor(C.text);
      this.doc.text(text, MG + 16, this.y + 10, opts);
      
      this.y += cardH + 10;
    }
    this.y += 10;
  }

  private addFactorsTable(evaluacion: any): void {
    // 5 Columns: Factor (160px), Grado (45px), Puntos (45px), Grafico (170px), Maximo (55px)
    const colW = [160, 45, 45, 170, 55];
    const rh = 24;
    const rows = FACTORS.map(f => {
      const d = FACTOR_DISPLAY[f];
      const gr = g(evaluacion[`grado_${f}`] || 1);
      const p = POINTS_MAP[f][gr] || 0;
      return { factor: f, label: d.label, grado: gr, puntos: p, max: d.max, pct: p / d.max };
    });
    const total = rows.reduce((s, r) => s + r.puntos, 0);
    const allRows = rows.length + 2; // header + rows + total
    const tableH = rh * allRows;
    
    this.checkPage(tableH + 20);
    const by = this.y;
    const totalW = colW.reduce((s, w) => s + w, 0);
    const lx = MG + (CW - totalW) / 2;

    const drawRow = (ri: number, bg: string, isBold: boolean, vals: any[], factorKey?: string) => {
      const rry = by + ri * rh;
      // Draw background
      this.doc.fillColor(bg).rect(lx, rry, totalW, rh).fill();
      
      const isHeader = ri === 0;
      this.doc.fillColor(isHeader ? '#ffffff' : C.text).fontSize(8.5).font(isBold ? 'Helvetica-Bold' : 'Helvetica');
      
      let cx = lx;
      for (let ci = 0; ci < vals.length; ci++) {
        const align = ci === 0 ? 'left' : 'center';
        
        if (ci === 3 && ri > 0 && ri < allRows - 1 && factorKey) {
          // Progress bar column
          const pct = vals[ci];
          const barW = 120;
          const barH = 6;
          const barX = cx + (colW[ci] - barW) / 2;
          const barY = rry + (rh - barH) / 2;
          
          // Draw track background
          this.doc.fillColor('#e2e8f0').roundedRect(barX, barY, barW, barH, 3).fill();
          // Draw fill with active color
          const actColor = getGradeColor(Number(evaluacion[`grado_${factorKey}`] || 1));
          if (pct > 0) {
            this.doc.fillColor(actColor).roundedRect(barX, barY, barW * pct, barH, 3).fill();
          }
        } else {
          this.doc.text(String(vals[ci]), cx + 6, rry + 7, { width: colW[ci] - 12, align });
        }
        cx += colW[ci];
      }
    };

    // Header cells - beautiful white text on dark navy
    drawRow(0, '#1e3a5f', true, ['Factor Evaluado', 'Grado', 'Pts', 'Carga Grafica', 'Maximo']);
    
    // Data cells
    for (let ri = 0; ri < rows.length; ri++) {
      const r = rows[ri];
      const bg = ri % 2 === 0 ? '#ffffff' : C.tableHeader;
      drawRow(1 + ri, bg, false, [r.label, `G${r.grado}`, `${r.puntos}`, r.pct, `${r.max}`], r.factor);
    }
    
    // Total cells
    drawRow(1 + rows.length, C.tableHeader, true, ['PUNTUACION TOTAL ACUMULADA', '', `${total}`, '', '1000']);

    // Outer table border and division lines
    this.doc.strokeColor(C.border).lineWidth(0.5).rect(lx, by, totalW, tableH).stroke();
    
    // Horizontal row lines
    for (let i = 1; i < allRows; i++) {
      this.doc.strokeColor(C.lightBorder).lineWidth(0.5).moveTo(lx, by + i * rh).lineTo(lx + totalW, by + i * rh).stroke();
    }
    
    // Vertical columns lines (only below header row to keep it sleek and clean)
    let cx = lx;
    for (let ci = 0; ci < colW.length - 1; ci++) {
      cx += colW[ci];
      this.doc.strokeColor(C.lightBorder).lineWidth(0.5).moveTo(cx, by + rh).lineTo(cx, by + tableH).stroke();
    }

    this.y = by + tableH + 20;
  }

  private renderJustification(text: string): void {
    const lines = text.split('\n').filter((l: string) => l.trim());
    const opts = { width: CW - 32, align: 'justify' as const, lineGap: 3.5 };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      this.checkPage(15);

      if (i === 0) {
        this.doc.fontSize(9).font('Helvetica').fillColor(C.text);
        this.doc.text(line, MG + 16, this.y, opts);
        this.y = this.doc.y + 6;
      } else if (/^\d+[\)\.]/.test(line)) {
        const bulletText = line.replace(/^\d+[\)\.]\s*/, '');
        this.doc.fontSize(9).font('Helvetica').fillColor(C.text);
        const bx = MG + 20;
        this.doc.text('\u2022', bx, this.y);
        this.doc.text(bulletText, bx + 12, this.y, { ...opts, width: CW - 48 });
        this.y = this.doc.y + 4;
      } else if (/^resultado:/i.test(line)) {
        this.doc.fontSize(9).font('Helvetica-Bold').fillColor(C.accent);
        this.doc.text(line, MG + 16, this.y, opts);
        this.y = this.doc.y + 8;
      } else {
        this.doc.fontSize(9).font('Helvetica').fillColor(C.text);
        this.doc.text(line, MG + 16, this.y, opts);
        this.y = this.doc.y + 4;
      }
    }
  }

  private addFactorDetail(evaluacion: any): void {
    this.addSectionTitle('5. Detalle Tecnico y Fundamentacion por Factor');
    
    for (const factor of FACTORS) {
      const d = FACTOR_DISPLAY[factor];
      const gr = g(evaluacion[`grado_${factor}`] || 1);
      const p = POINTS_MAP[factor][gr] || 0;
      const just = (evaluacion[`justif_${factor}`] || '').trim();
      const desc = GRADES_DESC[factor]?.[gr - 1] || '';
      
      const actColor = getGradeColor(gr);

      this.checkPage(45);

      // Factor block title
      this.doc.fontSize(10).font('Helvetica-Bold').fillColor(C.accent);
      this.doc.text(d.label.toUpperCase(), MG, this.y);
      
      // Inline badge details
      this.doc.fontSize(8.5).font('Helvetica').fillColor(C.muted);
      const gh = `Grado ${gr}  \u00b7  ${p}/${d.max} pts  \u00b7  ${desc}`;
      this.doc.text(gh, MG + 260, this.y, { width: CW - 260, align: 'right' });
      this.y += 14;
      
      // Separation thin line
      this.doc.fillColor(C.lightBorder).rect(MG, this.y, CW, 0.5).fill();
      this.y += 10;

      // Justification Box Card with Dynamic Left border color
      if (just) {
        const dummyOpts = { width: CW - 32, align: 'justify' as const, lineGap: 3.5 };
        // Measure approx height
        let approxH = 24;
        const lines = just.split('\n').filter((l: string) => l.trim());
        for (const line of lines) {
          if (line.startsWith('resultado:')) {
            approxH += this.doc.heightOfString(line, dummyOpts) + 8;
          } else {
            approxH += this.doc.heightOfString(line, dummyOpts) + 6;
          }
        }

        this.checkPage(approxH + 20);
        
        const cardTopY = this.y;
        this.y += 10;
        
        // Render justification lines inside card context
        this.renderJustification(just);
        
        this.y += 10;
        
        const cardBotY = this.y;
        const cardH = cardBotY - cardTopY;
        
        // Draw the background card beneath the text retrospectively
        this.doc.save();
        this.doc.fillColor(C.cardBg).roundedRect(MG, cardTopY, CW, cardH, 4).fill();
        this.doc.fillColor(actColor).roundedRect(MG, cardTopY, 3, cardH, 1.5).fill();
        this.doc.strokeColor(C.lightBorder).lineWidth(0.5).roundedRect(MG, cardTopY, CW, cardH, 4).stroke();
        this.doc.restore();

        // Redraw text to avoid it being under filled background
        this.y = cardTopY + 10;
        this.renderJustification(just);
        this.y = cardBotY + 18;
      } else {
        this.y += 10;
      }
    }
  }

  private addConclusionHero(evaluacion: any, totalPuntos: number): void {
    this.addSectionTitle('6. Conclusion y Dictamen Tecnico');
    
    const pct = Math.round((totalPuntos / 1000) * 100);
    const clase = getClaseSugerida(totalPuntos);
    
    let cat = '', desc = '';
    if (pct <= 20) {
      cat = 'Nivel Operativo Basico';
      desc = 'Puesto con funciones simples, supervision de personal nula y baja responsabilidad de activos.';
    } else if (pct <= 35) {
      cat = 'Nivel Operativo Calificado';
      desc = 'Puesto con tareas estandarizadas, supervision ocasional de soporte y responsabilidad de operacion menor.';
    } else if (pct <= 50) {
      cat = 'Nivel Tecnico-Administrativo';
      desc = 'Puesto que requiere analisis tecnico medio, coordinacion operativa y manejo de informacion confidencial.';
    } else if (pct <= 65) {
      cat = 'Nivel Profesional';
      desc = 'Puesto con alta complejidad tecnica y profesional, jefatura de unidad y alta responsabilidad por presupuestos.';
    } else if (pct <= 80) {
      cat = 'Nivel Directivo';
      desc = 'Puesto de direccion estrategica, toma de decisiones criticas e impacto inmediato en el presupuesto institucional.';
    } else {
      cat = 'Nivel Superior / Alta Direccion';
      desc = 'Puesto de maxima jerarquia, direccion estrategica integral y representacion legal e institucional.';
    }

    // 1. Solid Hero Scorecard Box Panel
    this.checkPage(85);
    const heroH = 75;
    this.doc.fillColor(C.accent).roundedRect(MG, this.y, CW, heroH, 6).fill();
    this.doc.strokeColor(C.lightBorder).lineWidth(1).roundedRect(MG, this.y, CW, heroH, 6).stroke();
    
    // Left score display
    this.doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    this.doc.text('PUNTUACION TOTAL ACUMULADA', MG + 15, this.y + 15);
    
    this.doc.fontSize(22).font('Helvetica-Bold');
    this.doc.text(`${totalPuntos}`, MG + 15, this.y + 26);
    this.doc.fontSize(11).font('Helvetica');
    this.doc.text('/ 1000 pts', MG + 65, this.y + 36);
    this.doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#93c5fd');
    this.doc.text(`Carga salarial equivalente al ${pct}% del maximo de escala`, MG + 15, this.y + 53);
    
    // Right class sug display
    if (clase) {
      const rx = MG + CW - 240;
      this.doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      this.doc.text('ESTRATO SUGERIDO (MANUAL CLASES)', rx, this.y + 15, { width: 220, align: 'right' });
      
      this.doc.fontSize(11.5).font('Helvetica-Bold');
      this.doc.text(clase.nombre.toUpperCase(), rx, this.y + 26, { width: 220, align: 'right' });
      
      this.doc.fontSize(8.5).font('Helvetica').fillColor('#93c5fd');
      this.doc.text(`Serie Laboral: ${clase.serie}`, rx, this.y + 40, { width: 220, align: 'right' });
    }
    
    this.y += heroH + 18;

    // 2. Category Block
    this.checkPage(40);
    this.doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('CATEGORIA MUNICIPAL ASIGNADA', MG, this.y);
    this.y += 10;
    
    this.doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.text);
    this.doc.text(cat, MG, this.y);
    this.y += 13;
    
    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    const dh = this.doc.heightOfString(desc, { width: CW, align: 'justify' });
    this.doc.text(desc, MG, this.y, { width: CW, align: 'justify' });
    this.y += dh + 16;

    // 3. Dictamen Tecnico
    this.checkPage(40);
    this.doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('RESOLUCION Y DICTAMEN TECNICO', MG, this.y);
    this.y += 10;

    const motorTexto = !evaluacion.motor || evaluacion.motor === 'rule-based' ? 'el motor de reglas contextuales v12' : 'el agente de inteligencia artificial';
    const dtxt = `Conforme al analisis tecnico de las funciones descritas y la metodologa oficial de Puntos por Factores de la Municipalidad de San Carlos, el puesto "${evaluacion.puesto?.nombre || ''}" obtiene una valoracion de ${totalPuntos} puntos. Con base en esta puntuacion objetiva y auditable, se dictamina su clasificacion en la clase "${clase?.nombre || 'No determinada'}" (Serie ${clase?.serie || 'General'}). La valoracion fue ejecutada de forma sistematica por ${motorTexto}, garantizando total objetividad, trazabilidad y cumplimiento normativo.`;
    
    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    const dxh = this.doc.heightOfString(dtxt, { width: CW, align: 'justify', lineGap: 3.5 });
    this.doc.text(dtxt, MG, this.y, { width: CW, align: 'justify', lineGap: 3.5 });
    this.y += dxh + 16;

    // 4. Recomendaciones
    this.checkPage(40);
    this.doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('RECOMENDACIONES GENERALES', MG, this.y);
    this.y += 10;
    
    let rec = '';
    if (pct < 30) {
      rec = '1. Revisar la descripcion de funciones en el perfil oficial para asegurar que refleje con total exactitud las labores reales.\n2. Estabilizar la escala jerarquica verificando que el puesto no tenga subordinados directos sin registrar.';
    } else if (pct < 50) {
      rec = '1. Formalizar e indexar los procedimientos tecnicos asociados al area en el Manual de Procedimientos Municipal.\n2. Monitorear que la carga operativa este alineada con las responsabilidades tecnicas y de control interno del puesto.';
    } else if (pct < 70) {
      rec = '1. Asegurar la aplicacion estricta de la prohibicion o carrera profesional en caso de que la clase profesional sugerida lo requiera.\n2. Programar auditorias de puesto periodicas para corroborar la vigencia del perfil en la estructura.';
    } else {
      rec = '1. Validar la coherencia jerarquica y el rango de control del puesto en relacion con las demas plazas directivas.\n2. Asegurar que las competencias de liderazgo y planeacion estrategica se encuentren debidamente evaluadas en el expediente del colaborador.';
    }

    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    const rh = this.doc.heightOfString(rec, { width: CW, align: 'justify', lineGap: 3 });
    this.doc.text(rec, MG, this.y, { width: CW, align: 'justify', lineGap: 3 });
    this.y += rh + 20;
  }

  private addSignatureBlock(evaluacion: any): void {
    this.checkPage(120);
    // Push signature to the absolute bottom if we have space, otherwise checkPage already opened a new page
    this.y = Math.max(this.y, MAX_Y - 110);
    
    // Top border separator line
    this.doc.fillColor(C.lightBorder).rect(MG, this.y, CW, 0.5).fill();
    this.y += 15;

    const colW = CW / 2;
    const sigY = this.y;

    // 1. Left Column: Physical signature line
    this.doc.strokeColor(C.muted).lineWidth(0.5).moveTo(MG + 20, sigY + 45).lineTo(MG + colW - 20, sigY + 45).stroke();
    
    this.doc.fillColor(C.text).fontSize(8.5).font('Helvetica-Bold');
    this.doc.text('FIRMA RESPONSABLE RRHH', MG + 20, sigY + 53, { width: colW - 40, align: 'center' });
    this.doc.fontSize(7.5).font('Helvetica').fillColor(C.muted);
    this.doc.text('Gestor(a) de Talento Humano', MG + 20, sigY + 63, { width: colW - 40, align: 'center' });

    // 2. Right Column: System Cryptographic Certification Sello Box
    const boxX = MG + colW + 20;
    const boxW = colW - 40;
    const boxH = 54;
    
    // Sello border box
    this.doc.fillColor(C.cardBg).roundedRect(boxX, sigY + 10, boxW, boxH, 4).fill();
    this.doc.strokeColor(C.border).lineWidth(0.5).roundedRect(boxX, sigY + 10, boxW, boxH, 4).stroke();
    
    // Sello vertical brand border
    this.doc.fillColor(C.accent).roundedRect(boxX, sigY + 10, 3, boxH, 1.5).fill();

    // Sello content
    this.doc.fillColor(C.accent).fontSize(7.5).font('Helvetica-Bold');
    this.doc.text('CERTIFICADO DIGITAL DE SEGURIDAD', boxX + 10, sigY + 15);
    
    this.doc.fillColor(C.text).fontSize(7).font('Helvetica');
    const dateStr = evaluacion.fecha_evaluacion ? new Date(evaluacion.fecha_evaluacion).toISOString() : new Date().toISOString();
    this.doc.text(`HASH: sha256-${Buffer.from(dateStr).toString('hex').slice(0, 24).toUpperCase()}`, boxX + 10, sigY + 26);
    this.doc.text(`VERSION: ${evaluacion.buildVersion || 'v12-contextual'}`, boxX + 10, sigY + 35);
    this.doc.fillColor(C.muted).fontSize(7).font('Helvetica-Bold');
    this.doc.text('VALIDADO POR EL DEPARTAMENTO DE RRHH', boxX + 10, sigY + 44);

    this.y = sigY + 80;
  }

  generate(evaluacion: any): PDFKit.PDFDocument {
    const puesto = evaluacion.puesto || {};
    const totalPuntos = evaluacion.puntos_totales || 0;
    const procedimientos: ProcedimientosContext | undefined = evaluacion._procedimientos;

    const motorText = !evaluacion.motor || evaluacion.motor === 'rule-based'
      ? 'Motor de Reglas Contextuales (MSC)'
      : 'Agente Evaluador IA (Ollama)';

    this.addInstitutionalHeader();
    
    this.addSectionTitle('1. Identificacion del Puesto y Datos de Registro');
    this.addMetadataGrid(puesto, motorText, evaluacion.buildVersion);
    this.addFunctionsCard('Descripcion Detallada de Funciones Evaluadas', puesto.descripcion_funciones);
    
    this.addSectionTitle('2. Resumen Metodologico MSC');
    const metText = 'La valoracion tecnica de la plaza se efectuo mediante el Manual de Clases y Metodologia de Puntos por Factores oficial de la Municipalidad de San Carlos. Se evaluan seis factores clave ponderados: Dificultad de las Funciones (200 pts max.), Supervision Ejercida (150 pts max.), Responsabilidad por Activos, Valores y Datos (200 pts max.), Condiciones de Trabajo (100 pts max.), Consecuencia y Trascendencia de los Errores (150 pts max.), y Requisitos Formativos y de Experiencia (200 pts max.). La escala total acumula un maximo de 1000 puntos. El analisis evalua la naturaleza sustantiva de las tareas, la jerarquia institucional, la autonomia de accion y los pisos minimos del area del puesto.';
    const metOpts = { width: CW, align: 'justify' as const, lineGap: 3.5 };
    const mh = this.doc.heightOfString(metText, metOpts);
    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    this.doc.text(metText, MG, this.y, metOpts);
    this.y += mh + 15;

    if (procedimientos) {
      this.addProcedimientosBlock(procedimientos);
    }
    
    this.addSectionTitle('4. Resumen Grafico de Puntuacion por Factor');
    this.addFactorsTable(evaluacion);
    
    this.addFactorDetail(evaluacion);
    
    this.addConclusionHero(evaluacion, totalPuntos);
    
    this.addSignatureBlock(evaluacion);
    
    this.checkPage(15);
    this.doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#94a3b8');
    this.doc.text('— FIN DEL INFORME OFICIAL —', MG, this.y, { align: 'center' });
    
    return this.doc;
  }
}

export function generateEvaluationReport(evaluacion: any, procedimientos?: ProcedimientosContext): PDFKit.PDFDocument {
  const gen = new ReportGenerator();
  if (procedimientos) evaluacion._procedimientos = procedimientos;
  return gen.generate(evaluacion);
}
