import PDFDocument from 'pdfkit';

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

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const MAX_Y = PAGE_HEIGHT - MARGIN;

class ReportGenerator {
  private doc: typeof PDFDocument.prototype;
  private y: number;

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      info: {
        Title: 'Informe Técnico de Valoración de Puestos',
        Author: 'Agente Evaluador IA - Municipalidad de San Carlos',
        Subject: 'Valoración Salarial - Metodología MSC',
        Creator: 'Sistema Integral RRHH'
      }
    });
    this.y = MARGIN;
  }

  private checkPage(): void {
    if (this.y > MAX_Y - 80) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  private moveDown(space: number): void {
    this.y += space;
    this.checkPage();
  }

  private addHeader(): void {
    this.doc.fontSize(18).font('Helvetica-Bold');
    this.doc.text('Municipalidad de San Carlos', MARGIN, this.y, { align: 'center' });
    this.y += 20;

    this.doc.fontSize(11).font('Helvetica');
    this.doc.text('Sistema Integral de RRHH - Valoración de Puestos', MARGIN, this.y, { align: 'center' });
    this.y += 8;
    this.doc.text('Metodología MSC — Puntos por Factores', MARGIN, this.y, { align: 'center' });
    this.y += 20;

    this.doc.moveTo(MARGIN + 20, this.y).lineTo(PAGE_WIDTH - MARGIN - 20, this.y).strokeColor('#1e40af').lineWidth(2).stroke();
    this.y += 20;
  }

  private addSectionTitle(title: string): void {
    this.checkPage();
    this.doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e3a5f');
    this.doc.text(title, MARGIN, this.y);
    this.y += 20;

    this.doc.fillColor('#e2e8f0');
    this.doc.rect(MARGIN, this.y - 5, CONTENT_WIDTH, 1.5).fill();
    this.doc.fillColor('#000000');
    this.y += 5;
  }

  private addField(label: string, value: string): void {
    this.checkPage();
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
    this.doc.text(label, MARGIN, this.y);
    this.y += 11;
    this.doc.fontSize(10).font('Helvetica').fillColor('#1e293b');
    const lines = this.doc.heightOfString(value || 'No especificado', { width: CONTENT_WIDTH });
    this.doc.text(value || 'No especificado', MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify' });
    this.y += Math.max(lines + 4, 16);
  }

  private addFunctionsBlock(label: string, text: string): void {
    this.checkPage();
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
    this.doc.text(label, MARGIN, this.y);
    this.y += 11;
    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    const lines = this.doc.heightOfString(text || 'No especificado', { width: CONTENT_WIDTH, align: 'justify' });
    if (this.y + lines > MAX_Y - 40) {
      this.doc.addPage();
      this.y = MARGIN;
    }
    this.doc.text(text || 'No especificado', MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify', lineGap: 3 });
    this.y += lines + 8;
  }

  private addFactorsTable(evaluacion: any): void {
    this.checkPage();

    const colWidths = [160, 55, 55, 280];
    const rowHeight = 22;
    const headerHeight = 24;

    const tableTop = this.y;
    let currentY = tableTop;

    const drawCell = (text: string, x: number, y: number, w: number, h: number, isHeader: boolean, isEven: boolean) => {
      if (isHeader) {
        this.doc.fillColor('#1e40af');
        this.doc.rect(x, y, w, h).fill();
        this.doc.fillColor('#ffffff');
      } else {
        this.doc.fillColor(isEven ? '#f8fafc' : '#ffffff');
        this.doc.rect(x, y, w, h).fill();
        this.doc.fillColor('#1e293b');
      }
      this.doc.lineWidth(0.5).strokeColor('#cbd5e1');
      this.doc.rect(x, y, w, h).stroke();

      this.doc.fontSize(isHeader ? 8 : 7.5).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      const textY = y + (h - 10) / 2;
      this.doc.text(text, x + 4, textY, { width: w - 8, align: 'left', lineBreak: false });
    };

    drawCell('Factor', MARGIN, currentY, colWidths[0], headerHeight, true, false);
    drawCell('Grado', MARGIN + colWidths[0], currentY, colWidths[1], headerHeight, true, false);
    drawCell('Puntos', MARGIN + colWidths[0] + colWidths[1], currentY, colWidths[2], headerHeight, true, false);
    drawCell('Justificación', MARGIN + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], headerHeight, true, false);

    currentY += headerHeight;

    const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];
    let total = 0;

    FACTORS.forEach((factor, idx) => {
      const display = FACTOR_DISPLAY[factor];
      const grado = evaluacion[display.gradoField] || 1;
      const puntos = POINTS_MAP[factor][grado] || 0;
      const just = evaluacion[display.justField] || '';
      total += puntos;

      const justHeight = Math.max(22, this.doc.heightOfString(just, { width: colWidths[3] - 8, align: 'left' }) + 8);

      if (currentY + Math.max(rowHeight, justHeight) > MAX_Y - 20) {
        this.doc.addPage();
        currentY = MARGIN;
        this.addSectionTitle('Análisis por Factor (continuación)');
        currentY += 10;

        drawCell('Factor', MARGIN, currentY, colWidths[0], headerHeight, true, false);
        drawCell('Grado', MARGIN + colWidths[0], currentY, colWidths[1], headerHeight, true, false);
        drawCell('Puntos', MARGIN + colWidths[0] + colWidths[1], currentY, colWidths[2], headerHeight, true, false);
        drawCell('Justificación', MARGIN + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], headerHeight, true, false);
        currentY += headerHeight;
      }

      const cellH = Math.max(rowHeight, justHeight);
      const isEven = idx % 2 === 0;

      drawCell(display.label, MARGIN, currentY, colWidths[0], cellH, false, isEven);
      drawCell(`Grado ${grado}`, MARGIN + colWidths[0], currentY, colWidths[1], cellH, false, isEven);
      drawCell(`${puntos} pts`, MARGIN + colWidths[0] + colWidths[1], currentY, colWidths[2], cellH, false, isEven);

      this.doc.fontSize(7.5).font('Helvetica').fillColor(isEven ? '#1e293b' : '#1e293b');
      this.doc.fillColor('#f8fafc');
      this.doc.rect(MARGIN + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], cellH).fill();
      this.doc.fillColor('#1e293b');
      this.doc.lineWidth(0.5).strokeColor('#cbd5e1');
      this.doc.rect(MARGIN + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], cellH).stroke();
      this.doc.text(just, MARGIN + colWidths[0] + colWidths[1] + colWidths[2] + 4, currentY + 3, { width: colWidths[3] - 8, align: 'left' });

      currentY += cellH;
    });

    this.doc.lineWidth(1).strokeColor('#1e40af');
    this.doc.moveTo(MARGIN, currentY).lineTo(MARGIN + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY).stroke();

    const totalLabel = `TOTAL`;
    const totalValue = `${total} / 1000 pts`;
    this.doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af');
    this.doc.text(totalLabel, MARGIN + 4, currentY + 6, { width: colWidths[0] + colWidths[1] + colWidths[2], align: 'right' });
    this.doc.text(totalValue, MARGIN + colWidths[0] + colWidths[1] + 4, currentY + 6, { width: colWidths[2], align: 'left' });

    this.y = currentY + 30;
  }

  private addConclusion(evaluacion: any, totalPuntos: number): void {
    this.checkPage();
    this.addSectionTitle('Conclusión y Dictamen Técnico');

    const porcentaje = Math.round((totalPuntos / 1000) * 100);
    let categoria = '';
    let descripcion = '';

    if (porcentaje <= 20) {
      categoria = 'Nivel Operativo Básico';
      descripcion = 'Puesto con funciones simples, supervisión mínima o nula, y baja responsabilidad institucional.';
    } else if (porcentaje <= 35) {
      categoria = 'Nivel Operativo Calificado';
      descripcion = 'Puesto con funciones estandarizadas, supervisión ocasional y responsabilidad moderada.';
    } else if (porcentaje <= 50) {
      categoria = 'Nivel Técnico-Administrativo';
      descripcion = 'Puesto que requiere análisis técnico, supervisión de grupos operativos y manejo de información sensible.';
    } else if (porcentaje <= 65) {
      categoria = 'Nivel Profesional';
      descripcion = 'Puesto con alta complejidad técnica, jefatura de unidad y responsabilidad por presupuestos.';
    } else if (porcentaje <= 80) {
      categoria = 'Nivel Directivo';
      descripcion = 'Puesto de dirección estratégica, toma de decisiones críticas y gestión de procesos clave.';
    } else {
      categoria = 'Nivel Superior / Alta Dirección';
      descripcion = 'Puesto de máxima responsabilidad institucional, dirección estratégica y gestión integral.';
    }

    this.checkPage();
    this.doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3a5f');
    this.doc.text('Puntuación Obtenida:', MARGIN, this.y);
    this.y += 14;
    this.doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af');
    this.doc.text(`${totalPuntos} / 1000 pts (${porcentaje}%)`, MARGIN, this.y);
    this.y += 22;

    this.doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3a5f');
    this.doc.text('Categoría Asignada:', MARGIN, this.y);
    this.y += 14;
    this.doc.fontSize(11).font('Helvetica-Bold').fillColor('#047857');
    this.doc.text(categoria, MARGIN, this.y);
    this.y += 18;

    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    const conclLines = this.doc.heightOfString(descripcion, { width: CONTENT_WIDTH, align: 'justify' });
    this.doc.text(descripcion, MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify' });
    this.y += conclLines + 12;
  }

  private addSignature(evaluacion: any): void {
    this.checkPage();
    this.y = Math.max(this.y, MAX_Y - 120);

    this.doc.moveTo(MARGIN + 20, this.y).lineTo(PAGE_WIDTH - MARGIN - 20, this.y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    this.y += 12;

    this.doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b');
    this.doc.text('FIRMA DIGITAL DEL SISTEMA', MARGIN, this.y, { align: 'center' });
    this.y += 14;

    this.doc.fontSize(8).font('Helvetica').fillColor('#475569');
    this.doc.text('Generado por:', MARGIN, this.y);
    this.y += 10;
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b');
    this.doc.text('Agente Evaluador IA — Sistema Integral RRHH', MARGIN, this.y);
    this.y += 14;

    this.doc.fontSize(8).font('Helvetica').fillColor('#475569');
    this.doc.text('Fecha de emisión:', MARGIN, this.y);
    this.y += 10;
    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    this.doc.text(evaluacion.fecha_evaluacion
      ? new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' }), MARGIN, this.y);
    this.y += 14;

    this.doc.fontSize(8).font('Helvetica').fillColor('#475569');
    this.doc.text('Periodo evaluado:', MARGIN, this.y);
    this.y += 10;
    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    this.doc.text(evaluacion.periodo || new Date().getFullYear().toString(), MARGIN, this.y);
    this.y += 14;

    this.doc.fontSize(8).font('Helvetica').fillColor('#475569');
    this.doc.text('Versión del informe:', MARGIN, this.y);
    this.y += 10;
    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    this.doc.text(`v${evaluacion.version || 1}.0 — Generado automáticamente`, MARGIN, this.y);
    this.y += 20;

    this.doc.fontSize(7).font('Helvetica-Oblique').fillColor('#94a3b8');
    this.doc.text('Este informe ha sido generado automáticamente por el Agente Evaluador IA. Los resultados se basan en el análisis objetivo de la descripción de funciones del puesto según la metodología MSC de Puntos por Factores.', MARGIN, this.y, { width: CONTENT_WIDTH, align: 'center' });
  }

  generate(evaluacion: any): PDFKit.PDFDocument {
    const puesto = evaluacion.puesto || {};
    const totalPuntos = evaluacion.puntos_totales || 0;

    this.addHeader();

    this.addSectionTitle('1. Datos del Puesto Evaluado');
    this.addField('Nombre del Puesto', puesto.nombre);
    this.addField('Área / Departamento', puesto.area);
    this.addField('Reporta a', puesto.reporta_a);
    this.addFunctionsBlock('Descripción de Funciones', puesto.descripcion_funciones);
    this.addField('Requisitos Académicos', puesto.educacion_requerida);
    this.addField('Experiencia Requerida', puesto.experiencia_requerida);

    this.addSectionTitle('2. Metodología Aplicada');
    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    const metodologiaText = 'La valoración se realizó mediante el método MSC de Puntos por Factores, ' +
      'evaluando seis factores ponderados: Dificultad de Funciones (200 pts máx.), Supervisión Ejercida (150 pts máx.), ' +
      'Responsabilidad (200 pts máx.), Condiciones de Trabajo (100 pts máx.), Consecuencia del Error (150 pts máx.), ' +
      'y Requisitos (200 pts máx.). La puntuación máxima posible es de 1000 puntos. ' +
      'Cada factor se califica en una escala del 1 al 5, donde 1 representa el nivel mínimo y 5 el nivel máximo. ' +
      'El análisis fue realizado por el Agente Evaluador IA, que aplica un proceso sistemático de revisión de ' +
      'la descripción de funciones, identificación de evidencia textual, y comparación contra la rúbrica de grados predefinida.';
    const lines = this.doc.heightOfString(metodologiaText, { width: CONTENT_WIDTH, align: 'justify' });
    this.doc.text(metodologiaText, MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify', lineGap: 3 });
    this.y += lines + 12;

    this.addSectionTitle('3. Análisis por Factor');
    this.addFactorsTable(evaluacion);

    this.addConclusion(evaluacion, totalPuntos);

    this.addSignature(evaluacion);

    this.doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
    this.doc.text(`— Fin del Informe —`, MARGIN, this.y, { align: 'center' });

    return this.doc;
  }
}

export function generateEvaluationReport(evaluacion: any): PDFKit.PDFDocument {
  const generator = new ReportGenerator();
  return generator.generate(evaluacion);
}
