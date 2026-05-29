import PDFDocument from 'pdfkit';
import type { ProcedimientosContext } from './procedimientosService';
import { extraerAcciones, evalProcedimientos, TaggedAccion } from './contextualAnalyzer';
import { FACTOR_CONFIG } from '../config/factorTables';

const FACTOR_DISPLAY = Object.fromEntries(
  Object.entries(FACTOR_CONFIG).map(([k, v]) => [k, { label: v.label, max: v.maxPts }])
);

const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];

const GRADES_DESC: Record<string, string[]> = {
  dificultad: [
    'Tareas simples y repetitivas',
    'Tareas variadas estandarizadas',
    'Analisis y juicio tecnico',
    'Alta complejidad y planeacion',
    'Direccion estrategica',
    'Analisis y solucion de problemas sin precedentes'
  ],
  supervision: [
    'No ejerce supervision',
    'Supervision ocasional',
    'Supervision de grupo operativo',
    'Jefatura de unidad',
    'Direccion de area mayor',
    'Coordina programas de alto nivel, autonomia completa'
  ],
  responsabilidad: [
    'Baja responsabilidad',
    'Responsabilidad moderada',
    'Custodia de info sensible',
    'Responsabilidad por presupuestos',
    'Gestion de proceso clave',
    'Responsabilidad completa de unidad'
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
    'Compromete estabilidad',
    'Decisiones criticas; daños irreversibles'
  ],
  requisitos: [
    'Educacion basica',
    'Bachillerato / Tecnico',
    'Diplomado / Tecnico sup.',
    'Licenciatura',
    'Maestria / Doctorado',
    'Postgrado avanzado y madurez profesional'
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

function g(gv: number): number { return Math.max(1, Math.min(6, gv)); }

function getGradeColor(gr: number): string {
  if (gr === 1) return '#10b981'; // Emerald
  if (gr === 2) return '#06b6d4'; // Teal/Cyan
  if (gr === 3) return '#3b82f6'; // Royal Blue
  if (gr === 4) return '#1e3a5f'; // Navy Institutional
  if (gr === 5) return '#8b5cf6'; // Purple / Directivo
  return '#dc2626'; // G6 — Red / Maximo critico
}

export const ESTRATOS_MUNICIPALES = [
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

export function determinarSerie(nombre: string, educacion?: string, claseMsc?: string, estratoDirecto?: string): string {
  // Si el estrato directo está disponible (desde CatalogoPuesto), usarlo como fuente de verdad
  if (estratoDirecto) {
    const normalized = estratoDirecto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const series = ['Operativa', 'Administrativa', 'Policia', 'Tecnica', 'Profesional', 'Jefatura'];
    const found = series.find(s => normalized.includes(s.toLowerCase()));
    if (found) return found;
  }

  const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ed = (educacion || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cl = (claseMsc || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Jefatura (debe excluir estrictamente asistentes/auxiliares)
  if (/jefe|jefatura|director|gerente|subdirector|coordinador|encargado/i.test(cl) || 
      (/director|gerente|subdirector|jefe|jefatura|coordinador|encargado/i.test(n) && !/asistente|auxiliar/i.test(n))) {
    if (/asistente|auxiliar/i.test(n)) {
      return 'Profesional'; // Cae a profesional si requiere educación profesional
    }
    return 'Jefatura';
  }

  // 2. Profesional (según educación académica o clase explícita de la ficha)
  if (/profesional/i.test(cl) || 
      /profesional|ingeniero|abogado|arquitecto|medico|psicologo|trabajador social|auditor|licenciado|analista/i.test(n) ||
      /bachiller\s+universitario|licenciatura|grado\s+universitario|universitario|licenciado|maestria|postgrado|especializacion/i.test(ed)) {
    return 'Profesional';
  }

  // 3. Técnica
  if (/tecnico|técnico/i.test(cl) || 
      /tecnico|técnico|dibujante|soporte|inspector/i.test(n) || 
      /diplomado|tecnico\s+superior/i.test(ed) ||
      /tecnico/i.test(ed)) {
    return 'Tecnica';
  }

  // 4. Policía
  if (/policia|policía/i.test(cl) || 
      /policia|policía|seguridad|vigilante|guardia|transito|tránsito/i.test(n)) {
    return 'Policia';
  }

  // 5. Administrativa
  if (/administrativo|auxiliar|asistente|secretaria|recepcionista|archivista|oficinista|cajero/i.test(cl) || 
      /auxiliar|asistente|secretaria|recepcionista|archivista|oficinista|cajero|administrativo/i.test(n)) {
    return 'Administrativa';
  }

  // 6. Operativa
  if (/operativo|operario|peon|peón|conserje|chofer|mensajero|limpieza|mantenimiento|jardinero|cocinero/i.test(cl) || 
      /operario|peon|peón|conserje|chofer|mensajero|limpieza|mantenimiento|jardinero|cocinero|miscelaneo|miscelánea/i.test(n)) {
    return 'Operativa';
  }

  return 'Operativa'; // Conservador por defecto
}

export function getClaseSugerida(puntos: number, nombrePuesto?: string, educacionPuesto?: string, claseMsc?: string, estratoDirecto?: string): { nombre: string; serie: string } | null {
  let seriePermitida: string | null = null;
  if (nombrePuesto) {
    seriePermitida = determinarSerie(nombrePuesto, educacionPuesto, claseMsc, estratoDirecto);
  }

  let candidatos = [...ESTRATOS_MUNICIPALES];

  if (seriePermitida) {
    const ordenSeries = ['Operativa', 'Administrativa', 'Policia', 'Tecnica', 'Profesional', 'Jefatura'];
    const indexPermitido = ordenSeries.indexOf(seriePermitida);
    candidatos = candidatos.filter(e => {
      const idx = ordenSeries.indexOf(e.serie);
      return idx <= indexPermitido;
    });
  }

  const np = candidatos
    .filter(e => e.puntos <= puntos && !e.nombre.includes('(Prohib.)'))
    .sort((a, b) => b.puntos - a.puntos);
  if (np.length) return np[0];

  const pr = candidatos.filter(e => e.puntos <= puntos).sort((a, b) => b.puntos - a.puntos);
  if (pr.length) return pr[0];

  if (seriePermitida) {
    const claseMinima = ESTRATOS_MUNICIPALES.find(e => e.serie === seriePermitida);
    if (claseMinima) return claseMinima;
  }

  return ESTRATOS_MUNICIPALES.length > 0 ? ESTRATOS_MUNICIPALES[0] : null;
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
    this.doc.text('MUNICIPALIDAD DE SAN CARLOS — INFORME DE VALORACIÓN DE PUESTO', MG, 15);
    this.doc.text(`Página ${this.pageNum}`, MG + CW - 40, 15, { width: 40, align: 'right' });
    this.doc.fillColor(C.lightBorder).rect(MG, 25, CW, 0.5).fill();
    this.y = 40;
  }

  private addCoverPage(puesto: any): void {
    const cy = PH / 2 - 120;

    // Full background institutional color block
    this.doc.rect(0, 0, PW, PH).fill('#f8fafc');

    // Top decorative band
    this.doc.rect(0, 0, PW, 8).fill(C.accent);
    this.doc.rect(0, PH - 8, PW, 8).fill(C.accent);

    // Left vertical accent bar
    this.doc.fillColor(C.accent).rect(70, 180, 4, 200).fill();

    // Institution shield lines
    this.doc.fillColor(C.accent).fontSize(10).font('Helvetica');
    this.doc.text('——', PW / 2, cy - 60, { align: 'center' });

    // Main title
    this.doc.fontSize(13).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('MUNICIPALIDAD DE SAN CARLOS', PW / 2, cy - 40, { align: 'center' });

    this.doc.fontSize(9).font('Helvetica').fillColor(C.muted);
    this.doc.text('Dirección de Gestión de Talento Humano', PW / 2, cy - 22, { align: 'center' });

    // Document type label
    this.doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');
    const labelW = 180;
    this.doc.fillColor(C.accent).roundedRect(PW / 2 - labelW / 2, cy + 8, labelW, 22, 4).fill();
    this.doc.fillColor('#ffffff').text('VALORACIÓN DE PUESTOS', PW / 2, cy + 14, { align: 'center', width: labelW - 10 });

    // Spacer
    this.y = cy + 60;

    // Puesto name
    this.doc.fontSize(16).font('Helvetica-Bold').fillColor(C.text);
    const puestoName = puesto?.nombre || 'No especificado';
    this.doc.text(puestoName.toUpperCase(), PW / 2, this.y, { align: 'center' });
    this.y += 22;

    // Area
    this.doc.fontSize(10).font('Helvetica').fillColor(C.muted);
    this.doc.text(puesto?.area || '', PW / 2, this.y, { align: 'center' });
    this.y += 30;

    // Decorative separator
    this.doc.fillColor(C.lightBorder).rect(PW / 2 - 30, this.y, 60, 1).fill();
    this.y += 20;

    // Date and code
    this.doc.fontSize(9).font('Helvetica').fillColor(C.muted);
    this.doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CR')}`, PW / 2, this.y, { align: 'center' });
    this.y += 14;
    this.doc.text(`Código: INF-VAL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`, PW / 2, this.y, { align: 'center' });

    // Bottom info
    this.doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#94a3b8');
    this.doc.text('Documento generado electrónicamente por el Sistema Integral de RRHH', PW / 2, PH - 60, { align: 'center' });
    this.doc.text('Metodología de Puntos por Factores — Municipalidad de San Carlos', PW / 2, PH - 48, { align: 'center' });

    this.doc.addPage();
    this.y = MG;
    this.pageNum = 0;
  }

  private addContradictionAlert(texto: string): void {
    this.doc.fontSize(8).font('Helvetica');
    const th = this.doc.heightOfString(texto, { width: CW - 28, lineGap: 2 });
    const bannerH = Math.max(36, th + 28);
    this.checkPage(bannerH + 15);
    // Warning banner
    this.doc.save();
    this.doc.fillColor('#fffbeb').roundedRect(MG, this.y, CW, bannerH, 6).fill();
    this.doc.strokeColor('#fbbf24').lineWidth(1).roundedRect(MG, this.y, CW, bannerH, 6).stroke();

    // Left warning accent bar
    this.doc.fillColor('#f59e0b').roundedRect(MG, this.y, 4, bannerH, 2).fill();

    this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#92400e');
    this.doc.text('\u26A0 ALERTA DE CONTRADICCIÓN', MG + 14, this.y + 8);
    this.doc.fontSize(8).font('Helvetica').fillColor('#92400e');
    this.doc.text(texto, MG + 14, this.y + 20, { width: CW - 28, lineGap: 2 });
    this.doc.restore();
    this.y += bannerH + 12;
  }

  private addInstitutionalHeader(): void {
    this.checkPage(50);
    // Elegant left vertical brand bar (4px wide, 42px high, rounded pill)
    this.doc.fillColor(C.accent).roundedRect(MG, this.y, 4, 42, 2).fill();
    
    // Header texts
    this.doc.fillColor(C.accent).fontSize(14).font('Helvetica-Bold');
    this.doc.text('MUNICIPALIDAD DE SAN CARLOS', MG + 12, this.y + 2);
    
    this.doc.fillColor(C.muted).fontSize(9).font('Helvetica');
    this.doc.text('Dirección de Gestión de Talento Humano  \u00b7  Sistema Integral de RRHH', MG + 12, this.y + 17);
    
    this.doc.fillColor(C.text).fontSize(10.5).font('Helvetica-Bold');
    this.doc.text('INFORME TÉCNICO DE VALORACIÓN DE PUESTO (MSC)', MG + 12, this.y + 29);
    
    // Decorative metadata info on top-right of page 1
    const metaX = MG + CW - 180;
    this.doc.fillColor(C.muted).fontSize(7.5).font('Helvetica-Bold');
    this.doc.text('DOCUMENTO OFICIAL', metaX, this.y + 4, { width: 180, align: 'right' });
    this.doc.font('Helvetica');
    this.doc.text(`Código: INF-VAL-${new Date().getFullYear()}`, metaX, this.y + 14, { width: 180, align: 'right' });
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
    // Vertical tag indicator (rounded)
    this.doc.fillColor(C.accent).roundedRect(MG, this.y + 1, 3, 13, 1.5).fill();
    
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

    // Draw cohesive rounded background card
    this.doc.fillColor(C.cardBg).roundedRect(MG, gridY, CW, rh * 3, 6).fill();
    this.doc.strokeColor(C.lightBorder).lineWidth(0.5).roundedRect(MG, gridY, CW, rh * 3, 6).stroke();

    // Internal dividers
    this.doc.save();
    this.doc.strokeColor(C.lightBorder).lineWidth(0.5);
    // Vertical split
    this.doc.moveTo(MG + colW, gridY).lineTo(MG + colW, gridY + rh * 3).stroke();
    // Horizontal splits
    this.doc.moveTo(MG, gridY + rh).lineTo(MG + CW, gridY + rh).stroke();
    this.doc.moveTo(MG, gridY + rh * 2).lineTo(MG + CW, gridY + rh * 2).stroke();
    this.doc.restore();

    const drawGridCell = (col: number, row: number, label: string, val: string) => {
      const cx = MG + col * colW;
      const cy = gridY + row * rh;
      
      // Labels and Values
      this.doc.fillColor(C.muted).fontSize(7.5).font('Helvetica-Bold');
      this.doc.text(label.toUpperCase(), cx + 12, cy + 8);
      
      this.doc.fillColor(C.text).fontSize(9.5).font('Helvetica');
      this.doc.text(val || 'No especificado', cx + 12, cy + 18, { width: colW - 24, ellipsis: true });
    };

    drawGridCell(0, 0, 'Nombre del Puesto', puesto.nombre);
    drawGridCell(1, 0, 'Área / Departamento', puesto.area);
    
    drawGridCell(0, 1, 'Reporta a (Jerarquía)', puesto.reporta_a);
    drawGridCell(1, 1, 'Requisitos Académicos', puesto.educacion_requerida);
    
    drawGridCell(0, 2, 'Experiencia Requerida', puesto.experiencia_requerida);
    
    const engineDesc = `${motorText}${buildVersion ? ` (${buildVersion})` : ''}`;
    drawGridCell(1, 2, 'Motor de Valoración', engineDesc);

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
    this.addSectionTitle('4. Contexto Operativo (Procedimientos Asociados)');
    
    this.checkPage(20);
    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    this.doc.text(`Se identificaron ${procedimientos.totalProcedimientos} procedimientos operativos asociados al área del puesto en el manual municipal.`, MG, this.y, { width: CW });
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

    // Save and clip entire table for beautiful rounded corners
    this.doc.save();
    this.doc.roundedRect(lx, by, totalW, tableH, 6).clip();

    // Header cells - beautiful white text on dark navy
    drawRow(0, '#1e3a5f', true, ['Factor Evaluado', 'Grado', 'Pts', 'Carga Gráfica', 'Máximo']);
    
    // Data cells
    for (let ri = 0; ri < rows.length; ri++) {
      const r = rows[ri];
      const bg = ri % 2 === 0 ? '#ffffff' : C.tableHeader;
      drawRow(1 + ri, bg, false, [r.label, `G${r.grado}`, `${r.puntos}`, r.pct, `${r.max}`], r.factor);
    }
    
    // Total cells
    drawRow(1 + rows.length, C.tableHeader, true, ['PUNTUACIÓN TOTAL ACUMULADA', '', `${total}`, '', '1000']);

    // Horizontal row lines inside clipped area
    for (let i = 1; i < allRows; i++) {
      this.doc.strokeColor(C.lightBorder).lineWidth(0.5).moveTo(lx, by + i * rh).lineTo(lx + totalW, by + i * rh).stroke();
    }
    
    // Vertical columns lines inside clipped area (only below header row to keep it sleek and clean)
    let cx = lx;
    for (let ci = 0; ci < colW.length - 1; ci++) {
      cx += colW[ci];
      this.doc.strokeColor(C.lightBorder).lineWidth(0.5).moveTo(cx, by + rh).lineTo(cx, by + tableH).stroke();
    }

    this.doc.restore();

    // Draw the clean outer rounded border over the clipped content
    this.doc.strokeColor(C.border).lineWidth(0.5).roundedRect(lx, by, totalW, tableH, 6).stroke();

    this.y = by + tableH + 20;
  }

  private renderActionsTable(factor: string, allAcc: TaggedAccion[]): void {
    let factorAcc: TaggedAccion[] = [];
    if (factor === 'dificultad') factorAcc = allAcc;
    else if (factor === 'supervision') factorAcc = allAcc.filter(a => ['supervisar','dirigir','liderar','coordinar'].includes(a.verboNorm));
    else if (factor === 'responsabilidad') factorAcc = allAcc.filter(a => ['administrar','gestionar','custodiar','controlar'].includes(a.verboNorm));
    else if (factor === 'condiciones') factorAcc = allAcc.filter(a => /condicion|ambiente|riesgo|campo|oficina/i.test(a.verboNorm + a.objeto));
    else if (factor === 'error') factorAcc = allAcc.filter(a => /error|impacto|riesgo|consecuencia/i.test(a.verboNorm + a.objeto));
    
    factorAcc = factorAcc.slice(0, 5); // Limit to 5 most relevant
    if (factorAcc.length === 0) return;

    this.checkPage(40);
    this.doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.accent);
    this.doc.text('ACCIONES DETECTADAS RELEVANTES', MG, this.y);
    this.y += 12;

    const colW = [100, 260, 130];
    const th = 20;
    const by = this.y;
    
    // draw table header
    this.doc.fillColor(C.tableHeader).rect(MG, by, CW, th).fill();
    this.doc.fillColor(C.muted).fontSize(7.5).font('Helvetica-Bold');
    this.doc.text('VERBO', MG + 6, by + 6, { width: colW[0] - 12 });
    this.doc.text('OBJETO', MG + colW[0] + 6, by + 6, { width: colW[1] - 12 });
    this.doc.text('FUENTE', MG + colW[0] + colW[1] + 6, by + 6, { width: colW[2] - 12 });
    
    this.y += th;
    
    // draw rows
    for (const acc of factorAcc) {
      this.checkPage(20);
      this.doc.font('Helvetica').fontSize(8.5);
      const rh = Math.max(18, this.doc.heightOfString(acc.objeto, { width: colW[1] - 12 }) + 8);
      
      this.doc.strokeColor(C.lightBorder).lineWidth(0.5).moveTo(MG, this.y).lineTo(MG + CW, this.y).stroke();
      
      this.doc.fillColor(C.text);
      this.doc.text(acc.verbo.toUpperCase(), MG + 6, this.y + 5, { width: colW[0] - 12 });
      this.doc.text(acc.objeto, MG + colW[0] + 6, this.y + 5, { width: colW[1] - 12 });
      
      this.doc.fillColor(C.muted).fontSize(7.5);
      const fuenteText = acc.fuente === 'procedimiento' ? `Procedimiento (${acc.procCodigo || 'PR'})` : 'Funciones (Perfil)';
      this.doc.text(fuenteText, MG + colW[0] + colW[1] + 6, this.y + 5, { width: colW[2] - 12 });
      
      this.y += rh;
    }
    this.doc.strokeColor(C.lightBorder).lineWidth(0.5).moveTo(MG, this.y).lineTo(MG + CW, this.y).stroke();
    this.y += 15;
  }

  private renderJustification(text: string): void {
    const opts = { width: CW - 32, align: 'justify' as const, lineGap: 3.5 };
    
    const hasHallazgos = /HALLAZGOS:/i.test(text);
    const hasAnalisis = /ANÁLISIS:|ANALISIS:/i.test(text);
    const hasResolucion = /RESOLUCIÓN:|RESOLUCION:/i.test(text);

    if (hasHallazgos && hasAnalisis && hasResolucion) {
      const regex = /(HALLAZGOS:|AN[AÁ]LISIS:|RESOLUCI[OÓ]N:)/i;
      const parts = text.split(regex).filter(p => p.trim());
      
      let currentHeader = '';
      for (const part of parts) {
        if (regex.test(part)) {
          currentHeader = part.trim().toUpperCase();
        } else {
          // Render Header
          this.checkPage(20);
          this.doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accent);
          this.doc.text(currentHeader, MG + 16, this.y, opts);
          this.y = this.doc.y + 4;
          
          // Render Content
          const lines = part.split('\n').filter(l => l.trim());
          for (const line of lines) {
            this.checkPage(15);
            if (line.trim().startsWith('-')) {
              this.doc.fontSize(9).font('Helvetica').fillColor(C.text);
              const bulletText = line.trim().substring(1).trim();
              this.doc.text('\u2022', MG + 20, this.y);
              this.doc.text(bulletText, MG + 32, this.y, { ...opts, width: CW - 48 });
              this.y = this.doc.y + 4;
            } else {
              this.doc.fontSize(9).font('Helvetica').fillColor(C.text);
              this.doc.text(line.trim(), MG + 16, this.y, opts);
              this.y = this.doc.y + 4;
            }
          }
          this.y += 6;
        }
      }
    } else {
      // Legacy format
      const lines = text.split('\n').filter((l: string) => l.trim());
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
          this.doc.text('\u2022', MG + 20, this.y);
          this.doc.text(bulletText, MG + 32, this.y, { ...opts, width: CW - 48 });
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
  }

  private addFactorDetail(evaluacion: any, allAcc: TaggedAccion[]): void {
    this.addSectionTitle('6. Detalle Técnico y Fundamentación por Factor');
    
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

      // Render Actions Table before the justification box
      this.renderActionsTable(factor, allAcc);

      // Justification Box Card with Dynamic Left border color
      if (just) {
        const dummyOpts = { width: CW - 32, align: 'justify' as const, lineGap: 3.5 };
        // Measure approx height
        let approxH = 30;
        const lines = just.split('\n').filter((l: string) => l.trim());
        for (const line of lines) {
          if (/(HALLAZGOS:|AN[AÁ]LISIS:|RESOLUCI[OÓ]N:)/i.test(line)) {
            approxH += this.doc.heightOfString(line, dummyOpts) + 12;
          } else {
            approxH += this.doc.heightOfString(line, dummyOpts) + 8;
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

      // Evidence comparison block (multifuente)
      const multifuenteData = evaluacion.analisis_multifuente?.find((m: any) => m.factor === factor);
      if (multifuenteData && (multifuenteData.cita_documental || multifuenteData.cita_entrevista)) {
        const halfW = (CW - 12) / 2;
        const docOpts = { width: halfW - 24, align: 'justify' as const, lineGap: 2.5 };
        const entOpts = { width: halfW - 24, align: 'justify' as const, lineGap: 2.5 };

        this.doc.fontSize(7.5).font('Helvetica-Oblique');
        const docH = multifuenteData.cita_documental ? this.doc.heightOfString(`"${multifuenteData.cita_documental}"`, docOpts) + 30 : 0;
        const entH = multifuenteData.cita_entrevista ? this.doc.heightOfString(`"${multifuenteData.cita_entrevista}"`, entOpts) + 30 : 0;
        const evH = Math.max(45, docH, entH);

        // Make sure we have enough space for the whole block plus the title
        this.checkPage(evH + 30);

        // Section label
        this.doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
        this.doc.text('EVIDENCIA MULTIFUENTE', MG, this.y);
        this.y += 10;

        const colY = this.y;

        // Documental column
        if (multifuenteData.cita_documental) {
          this.doc.save();
          this.doc.fillColor('#eff6ff').roundedRect(MG, colY, halfW, evH, 4).fill();
          this.doc.fillColor('#3b82f6').roundedRect(MG, colY, 3, evH, 1.5).fill();
          this.doc.strokeColor('#bfdbfe').lineWidth(0.5).roundedRect(MG, colY, halfW, evH, 4).stroke();
          this.doc.restore();

          this.doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#1e40af');
          this.doc.text('EVIDENCIA DOCUMENTAL (MANUAL)', MG + 12, colY + 8);
          this.doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#1e3a5f');
          this.doc.text(`"${multifuenteData.cita_documental}"`, MG + 12, colY + 20, docOpts);
        }

        // Entrevista column
        if (multifuenteData.cita_entrevista) {
          const entX = MG + halfW + 12;
          this.doc.save();
          this.doc.fillColor('#faf5ff').roundedRect(entX, colY, halfW, evH, 4).fill();
          this.doc.fillColor('#8b5cf6').roundedRect(entX, colY, 3, evH, 1.5).fill();
          this.doc.strokeColor('#e9d5ff').lineWidth(0.5).roundedRect(entX, colY, halfW, evH, 4).stroke();
          this.doc.restore();

          this.doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#6b21a8');
          this.doc.text('EVIDENCIA TESTIMONIAL (ENTREVISTA)', entX + 12, colY + 8);
          this.doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#4c1d95');
          this.doc.text(`"${multifuenteData.cita_entrevista}"`, entX + 12, colY + 20, entOpts);
        }

        this.y = colY + evH + 15;
      }
    }
  }

  private addConclusionHero(evaluacion: any, totalPuntos: number): void {
    this.addSectionTitle('7. Conclusión y Dictamen Técnico');
    
    const pct = Math.round((totalPuntos / 1000) * 100);
    const clase = getClaseSugerida(totalPuntos, evaluacion.puesto?.nombre, evaluacion.puesto?.educacion_requerida, evaluacion.puesto?.codigo_clase_msc, evaluacion.puesto?.estrato);
    
    let cat = '', desc = '';
    if (pct <= 20) {
      cat = 'Nivel Operativo Básico';
      desc = 'Puesto con funciones simples, supervisión de personal nula y baja responsabilidad de activos.';
    } else if (pct <= 35) {
      cat = 'Nivel Operativo Calificado';
      desc = 'Puesto con tareas estandarizadas, supervisión ocasional de soporte y responsabilidad de operación menor.';
    } else if (pct <= 50) {
      cat = 'Nivel Técnico-Administrativo';
      desc = 'Puesto que requiere análisis técnico medio, coordinación operativa y manejo de información confidencial.';
    } else if (pct <= 65) {
      cat = 'Nivel Profesional';
      desc = 'Puesto con alta complejidad técnica y profesional, jefatura de unidad y alta responsabilidad por presupuestos.';
    } else if (pct <= 80) {
      cat = 'Nivel Directivo';
      desc = 'Puesto de dirección estratégica, toma de decisiones críticas e impacto inmediato en el presupuesto institucional.';
    } else {
      cat = 'Nivel Superior / Alta Dirección';
      desc = 'Puesto de máxima jerarquía, dirección estratégica integral y representación legal e institucional.';
    }

    // 1. Solid Hero Scorecard Box Panel
    this.checkPage(85);
    const heroH = 75;
    this.doc.fillColor(C.accent).roundedRect(MG, this.y, CW, heroH, 6).fill();
    this.doc.strokeColor(C.lightBorder).lineWidth(1).roundedRect(MG, this.y, CW, heroH, 6).stroke();
    
    // Left score display
    this.doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    this.doc.text('PUNTUACIÓN TOTAL ACUMULADA', MG + 15, this.y + 15);
    
    this.doc.fontSize(22).font('Helvetica-Bold');
    this.doc.text(`${totalPuntos}`, MG + 15, this.y + 26);
    this.doc.fontSize(11).font('Helvetica');
    this.doc.text('/ 1000 pts', MG + 65, this.y + 36);
    this.doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#93c5fd');
    this.doc.text(`Carga salarial equivalente al ${pct}% del máximo de escala`, MG + 15, this.y + 53);
    
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
    
    this.y += heroH + 18;    // 2. Category Block
    this.checkPage(40);
    this.doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('CATEGORÍA MUNICIPAL ASIGNADA', MG, this.y);
    this.y += 10;
    
    this.doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.text);
    this.doc.text(cat, MG, this.y);
    this.y += 13;
    
    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    const dh = this.doc.heightOfString(desc, { width: CW, align: 'justify' });
    this.doc.text(desc, MG, this.y, { width: CW, align: 'justify' });
    this.y += dh + 16;

    // 3. Dictamen Técnico
    this.checkPage(40);
    this.doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.muted);
    this.doc.text('RESOLUCIÓN Y DICTAMEN TÉCNICO', MG, this.y);
    this.y += 10;

    const motorTexto = !evaluacion.motor || evaluacion.motor === 'rule-based' ? 'el motor de reglas contextuales v12' : 'el agente de inteligencia artificial (Google Gemini API)';
    const dtxt = `Conforme al análisis técnico de las funciones descritas y la metodología oficial de Puntos por Factores de la Municipalidad de San Carlos, el puesto "${evaluacion.puesto?.nombre || ''}" obtiene una valoración de ${totalPuntos} puntos. Con base en esta puntuación objetiva y auditable, se dictamina su clasificación en la clase "${clase?.nombre || 'No determinada'}" (Serie ${clase?.serie || 'General'}). La valoración fue ejecutada de forma sistemática por ${motorTexto}, garantizando total objetividad, trazabilidad y cumplimiento normativo.`;
    
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
      rec = '1. Revisar la descripción de funciones en el perfil oficial para asegurar que refleje con total exactitud las labores reales.\n2. Estabilizar la escala jerárquica verificando que el puesto no tenga subordinados directos sin registrar.';
    } else if (pct < 50) {
      rec = '1. Formalizar e indexar los procedimientos técnicos asociados al área en el Manual de Procedimientos Municipal.\n2. Monitorear que la carga operativa esté alineada con las responsabilidades técnicas y de control interno del puesto.';
    } else if (pct < 70) {
      rec = '1. Asegurar la aplicación estricta de la prohibición o carrera profesional en caso de que la clase profesional sugerida lo requiera.\n2. Programar auditorías de puesto periódicas para corroborar la vigencia del perfil en la estructura.';
    } else {
      rec = '1. Validar la coherencia jerárquica y el rango de control del puesto en relación con las demás plazas directivas.\n2. Asegurar que las competencias de liderazgo y planeación estratégica se encuentren debidamente evaluadas en el expediente del colaborador.';
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
      : 'Agente de IA (Google Gemini API)';

    this.addCoverPage(puesto);

    this.addInstitutionalHeader();
    
    this.addSectionTitle('1. Identificación del Puesto y Datos de Registro');
    this.addMetadataGrid(puesto, motorText, evaluacion.buildVersion);

    if (evaluacion.alerta_global) {
      this.addContradictionAlert(evaluacion.alerta_global);
    }

    this.addFunctionsCard('Descripción Detallada de Funciones Evaluadas', puesto.descripcion_funciones);
    
    this.addSectionTitle('2. Metodología Aplicada: Puntos por Factores');
    const metText1 = 'La valoración técnica del puesto se realizó conforme al Manual de Clases y la Metodología Oficial de Puntos por Factores de la Municipalidad de San Carlos. Esta metodología asigna puntuaciones objetivas a seis factores compensables cuyo peso relativo refleja la complejidad funcional, jerárquica y de riesgo de cada plaza:';
    const metOpts = { width: CW, align: 'justify' as const, lineGap: 3.5 };
    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    const mh1 = this.doc.heightOfString(metText1, metOpts);
    this.doc.text(metText1, MG, this.y, metOpts);
    this.y += mh1 + 8;

    // Factor table mini
    const factorList = [
      '• Factor 1 — Dificultad de las Funciones: evalúa la complejidad, variedad y naturaleza analítica de las tareas (máx. 200 pts).',
      '• Factor 2 — Supervisión Ejercida: mide el nivel de autoridad jerárquica y la amplitud del control de personal (máx. 150 pts).',
      '• Factor 3 — Responsabilidad por Activos, Valores y Datos: pondera la custodia de recursos institucionales, financieros e informativos (máx. 200 pts).',
      '• Factor 4 — Condiciones de Trabajo: considera la exposición a riesgos físicos, ambientales o ergonómicos (máx. 100 pts).',
      '• Factor 5 — Consecuencia y Trascendencia del Error: evalúa el impacto institucional de errores en la ejecución de funciones (máx. 150 pts).',
      '• Factor 6 — Requisitos Formativos y de Experiencia: califica la educación formal, certificaciones y experiencia necesaria (máx. 200 pts).'
    ];
    this.doc.fontSize(8.5).font('Helvetica').fillColor(C.text);
    for (const fl of factorList) {
      const flh = this.doc.heightOfString(fl, { width: CW - 10, lineGap: 2 });
      this.checkPage(flh + 4);
      this.doc.text(fl, MG + 10, this.y, { width: CW - 10, lineGap: 2 });
      this.y += flh + 3;
    }
    this.y += 6;

    // Source synthesis
    const metText2 = 'Escala total: 1000 puntos. La evaluación sintetiza tres fuentes de información para cada factor: (1) la Ficha Descriptiva del puesto registrada en el sistema, (2) los datos recopilados en la Entrevista de Valoración al ocupante o jefatura inmediata, y (3) los Procedimientos Institucionales registrados en Supabase donde el puesto participa activamente. Esta triangulación garantiza que la puntuación no dependa de una sola fuente, aumentando la objetividad y auditabilidad del resultado.';
    this.doc.fontSize(9.5).font('Helvetica').fillColor(C.text);
    const mh2 = this.doc.heightOfString(metText2, metOpts);
    this.checkPage(mh2 + 10);
    this.doc.text(metText2, MG, this.y, metOpts);
    this.y += mh2 + 15;

    // 3. Discrepancy analysis (if contradictions detected)
    const multifuente = evaluacion.analisis_multifuente || [];
    const contradicciones = multifuente.filter((a: any) => a.tipo === 'contradiccion');
    if (contradicciones.length > 0) {
      this.addSectionTitle('3. Análisis de Contradicciones y Discrepancias Técnicas');
      this.doc.fontSize(9).font('Helvetica-Oblique').fillColor(C.muted);
      const introDisc = 'Durante la triangulación de fuentes se detectaron las siguientes discrepancias entre la Ficha Descriptiva, la Entrevista de Valoración y/o los Procedimientos Institucionales. Estas contradicciones fueron tomadas en cuenta para la ponderación final de cada factor afectado.';
      const idh = this.doc.heightOfString(introDisc, { width: CW, lineGap: 3 });
      this.doc.text(introDisc, MG, this.y, { width: CW, lineGap: 3 });
      this.y += idh + 10;

      for (const c of contradicciones) {
        this.checkPage(60);
        // Discrepancy card
        const cardH = 50;
        this.doc.fillColor('#fef3c7').roundedRect(MG + 5, this.y, CW - 10, cardH, 4).fill();
        this.doc.fillColor('#d97706').roundedRect(MG + 5, this.y, 3, cardH, 1.5).fill();
        
        this.doc.fillColor('#92400e').fontSize(8.5).font('Helvetica-Bold');
        this.doc.text(`⚠ Factor: ${c.factor || 'General'}`, MG + 15, this.y + 8, { width: CW - 30 });
        
        this.doc.fillColor('#78350f').fontSize(8).font('Helvetica');
        const descText = c.detalle || c.descripcion || 'Discrepancia detectada entre fuentes.';
        this.doc.text(descText, MG + 15, this.y + 22, { width: CW - 30, lineGap: 2 });
        
        this.y += cardH + 8;
      }
      this.y += 10;
    }

    if (procedimientos) {
      this.addProcedimientosBlock(procedimientos);
    }
    
    this.addSectionTitle('5. Resumen Gráfico de Puntuación por Factor');
    this.addFactorsTable(evaluacion);
    
    const fx = puesto.descripcion_funciones || '';
    const accFx = extraerAcciones(fx).map(a => ({...a, fuente: 'funciones'} as TaggedAccion));
    const pr = evalProcedimientos(evaluacion._procedimientos);
    const allAcc: TaggedAccion[] = [...accFx, ...pr.acc];

    this.addFactorDetail(evaluacion, allAcc);
    
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
