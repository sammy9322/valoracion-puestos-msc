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

  private checkPage(needed: number = 80): void {
    if (this.y > MAX_Y - needed) {
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
    this.checkPage(40);
    this.doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e3a5f');
    this.doc.text(title, MARGIN, this.y);
    this.y += 20;

    this.doc.fillColor('#e2e8f0');
    this.doc.rect(MARGIN, this.y - 5, CONTENT_WIDTH, 1.5).fill();
    this.doc.fillColor('#000000');
    this.y += 5;
  }

  private addField(label: string, value: string): void {
    this.doc.fontSize(10).font('Helvetica').fillColor('#1e293b');
    const valueOpts = { width: CONTENT_WIDTH, align: 'justify' as const };
    const textH = this.doc.heightOfString(value || 'No especificado', valueOpts);
    this.checkPage(textH + 30);
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
    this.doc.text(label, MARGIN, this.y);
    this.y += 11;
    this.doc.fontSize(10).font('Helvetica').fillColor('#1e293b');
    this.doc.text(value || 'No especificado', MARGIN, this.y, valueOpts);
    this.y += textH + 6;
  }

  private addFunctionsBlock(label: string, text: string): void {
    const opts = { width: CONTENT_WIDTH, align: 'justify' as const, lineGap: 3 };
    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    const textH = this.doc.heightOfString(text || 'No especificado', opts);
    this.checkPage(textH + 40);
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
    this.doc.text(label, MARGIN, this.y);
    this.y += 11;
    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    this.doc.text(text || 'No especificado', MARGIN, this.y, opts);
    this.y += textH + 8;
  }

  private addProcedimientosBlock(procedimientos: ProcedimientosContext): void {
    this.addSectionTitle('3. Contexto Operativo (Procedimientos Asociados)');

    this.doc.fontSize(9).font('Helvetica').fillColor('#475569');
    const sopts = { width: CONTENT_WIDTH, align: 'justify' as const, lineGap: 2 };
    const procIntro = `Se identificaron ${procedimientos.totalProcedimientos} procedimientos asociados al area del puesto. A continuacion se detalla cada procedimiento con su proposito, alcance, pasos y politicas operativas. El analisis de factores considero tanto la descripcion oficial como las actividades descritas en estos procedimientos.`;
    const introH = this.doc.heightOfString(procIntro, sopts);
    this.checkPage(introH + 30);
    this.doc.text(procIntro, MARGIN, this.y, sopts);
    this.y += introH + 12;

    for (const proc of procedimientos.procedimientos) {
      this.checkPage(50);
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e3a5f');
      this.doc.text(`${proc.nombre} (${proc.codigo})`, MARGIN, this.y);
      this.y += 12;

      this.doc.fontSize(8).font('Helvetica').fillColor('#475569');

      if (proc.proposito) {
        const ppOpts = { width: CONTENT_WIDTH, align: 'justify' as const };
        const ppH = this.doc.heightOfString(`Proposito: ${proc.proposito}`, ppOpts);
        this.doc.text(`Proposito: ${proc.proposito}`, MARGIN, this.y, ppOpts);
        this.y += ppH + 4;
      }

      if (proc.alcance) {
        const alcOpts = { width: CONTENT_WIDTH, align: 'justify' as const };
        const alcH = this.doc.heightOfString(`Alcance: ${proc.alcance}`, alcOpts);
        this.doc.text(`Alcance: ${proc.alcance}`, MARGIN, this.y, alcOpts);
        this.y += alcH + 4;
      }

      const pasosProc = procedimientos.pasos.filter((p: any) => p.procedimiento_codigo === proc.codigo);
      if (pasosProc.length > 0) {
        this.doc.fontSize(8).font('Helvetica-Oblique').fillColor('#334155');
        for (const paso of pasosProc) {
          this.checkPage(20);
          const pasoOpts = { width: CONTENT_WIDTH - 10, align: 'justify' as const };
          const pasoH = this.doc.heightOfString(`  - ${paso.descripcion}`, pasoOpts);
          this.doc.text(`  - ${paso.descripcion}`, MARGIN, this.y, pasoOpts);
          this.y += pasoH + 2;
        }
      }

      const politicasProc = procedimientos.politicas.filter((p: any) => p.procedimiento_codigo === proc.codigo);
      if (politicasProc.length > 0) {
        this.doc.fontSize(8).font('Helvetica-Oblique').fillColor('#92400e');
        for (const pol of politicasProc) {
          this.checkPage(20);
          const polOpts = { width: CONTENT_WIDTH - 10, align: 'justify' as const };
          const polH = this.doc.heightOfString(`  * Politica: ${pol.politica}`, polOpts);
          this.doc.text(`  * Politica: ${pol.politica}`, MARGIN, this.y, polOpts);
          this.y += polH + 2;
        }
      }

      this.y += 6;
    }
  }

  private addFactorsTable(evaluacion: any): void {
    this.checkPage(120);

    const colWidths = [180, 50, 50, 70];
    const headerHeight = 22;
    const rowH = 22;

    const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];


    let hx = MARGIN;
    ['Factor', 'Grado', 'Pts', '%'].forEach((text, i) => {
      this.doc.fillColor('#1e40af');
      this.doc.rect(hx, this.y, colWidths[i], headerHeight).fill();
      this.doc.fillColor('#ffffff');
      this.doc.lineWidth(0.5).strokeColor('#cbd5e1');
      this.doc.rect(hx, this.y, colWidths[i], headerHeight).stroke();
      this.doc.fontSize(8).font('Helvetica-Bold');
      this.doc.text(text, hx + 4, this.y + 6, { width: colWidths[i] - 8, align: 'left' });
      hx += colWidths[i];
    });
    this.y += headerHeight;

    let total = 0;
    let pageFactorIdx = 0;

    for (const factor of FACTORS) {
      const display = FACTOR_DISPLAY[factor];
      const grado = evaluacion[display.gradoField] || 1;
      const puntos = POINTS_MAP[factor][grado] || 0;
      total += puntos;

      const isEven = pageFactorIdx % 2 === 0;
      const bgColor = isEven ? '#f8fafc' : '#ffffff';

      if (this.y + rowH > MAX_Y - 10) {
        this.doc.addPage();
        this.y = MARGIN;
        this.addSectionTitle('Resumen por Factor (continuación)');
        this.y += 8;
      }

      let cx = MARGIN;
      const rowData = [display.label, `G${grado}`, `${puntos}`, `${Math.round(puntos / 200 * 100)}%`];

      for (let i = 0; i < colWidths.length; i++) {
        this.doc.fillColor(bgColor);
        this.doc.rect(cx, this.y, colWidths[i], rowH).fill();
        this.doc.fillColor('#1e293b');
        this.doc.lineWidth(0.5).strokeColor('#cbd5e1');
        this.doc.rect(cx, this.y, colWidths[i], rowH).stroke();
        this.doc.fontSize(7.5).font('Helvetica');
        this.doc.text(rowData[i], cx + 4, this.y + (rowH - 10) / 2, { width: colWidths[i] - 8, align: 'left' });
        cx += colWidths[i];
      }

      this.y += rowH;
      pageFactorIdx++;
    }

    this.doc.lineWidth(1).strokeColor('#1e40af');
    this.doc.moveTo(MARGIN, this.y).lineTo(MARGIN + colWidths.reduce((a, b) => a + b, 0), this.y).stroke();
    this.y += 4;

    this.doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af');
    this.doc.text(`TOTAL`, MARGIN + 4, this.y, { width: colWidths[0] + colWidths[1] + colWidths[2], align: 'right' });
    this.doc.text(`${total} / 1000 pts`, MARGIN + colWidths[0] + colWidths[1] + 4, this.y, { width: colWidths[2], align: 'left' });
    this.y += 16;

    const procCtx: any = (evaluacion as any)._procedimientos;
    if (procCtx) {
      this.doc.fontSize(7).font('Helvetica-Oblique').fillColor('#64748b');
      this.doc.text(
        `* Analisis basado en las funciones oficiales del puesto y ${procCtx.totalProcedimientos} procedimientos operativos asociados al area.`,
        MARGIN, this.y, { width: CONTENT_WIDTH, align: 'left' }
      );
      this.y += 16;
    }
  }

  private addFactorDetail(evaluacion: any): void {
    this.checkPage(80);
    this.addSectionTitle('5. Detalle Técnico por Factor');

    const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];
    const GRADES_DESC: Record<string, string[]> = {
      dificultad: ['Tareas simples y repetitivas', 'Tareas variadas estandarizadas', 'Analisis y juicio tecnico', 'Alta complejidad y planeacion', 'Direccion estrategica'],
      supervision: ['No ejerce supervision', 'Supervision ocasional', 'Supervision de grupo operativo', 'Jefatura de unidad', 'Direccion de area mayor'],
      responsabilidad: ['Baja responsabilidad', 'Responsabilidad moderada', 'Custodia de info sensible', 'Responsabilidad por presupuestos', 'Gestion de proceso clave'],
      condiciones: ['Oficina normal', 'Esfuerzo moderado', 'Exposicion climatica o ruido', 'Riesgo de accidentes', 'Alta peligrosidad'],
      error: ['Error facil de corregir', 'Retrasos menores', 'Afecta otros deptos', 'Perdidas economicas/legales', 'Compromete estabilidad'],
      requisitos: ['Educacion basica', 'Bachillerato / Tecnico', 'Diplomado / Tecnico sup.', 'Licenciatura', 'Maestria / Doctorado'],
    };

    for (const factor of FACTORS) {
      const display = FACTOR_DISPLAY[factor];
      const grado = evaluacion[display.gradoField] || 1;
      const puntos = POINTS_MAP[factor][grado] || 0;
      const just = evaluacion[display.justField] || '';
      const desc = GRADES_DESC[factor]?.[grado - 1] || '';

      this.checkPage(60);

      this.doc.fontSize(8.5).font('Helvetica');
      const justOpts = { width: CONTENT_WIDTH - 16, align: 'justify' as const, lineGap: 2 };
      const justH = this.doc.heightOfString(just, justOpts);

      const boxY = this.y;
      const boxH = 54 + justH;

      // Box border
      this.doc.fillColor('#f1f5f9');
      this.doc.rect(MARGIN, boxY, CONTENT_WIDTH, boxH).fill();
      this.doc.fillColor('#cbd5e1');
      this.doc.lineWidth(1);
      this.doc.rect(MARGIN, boxY, CONTENT_WIDTH, boxH).stroke();

      // Header stripe
      this.doc.fillColor('#1e3a5f');
      this.doc.rect(MARGIN, boxY, CONTENT_WIDTH, 28).fill();

      // Factor title
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      this.doc.text(display.label, MARGIN + 8, boxY + 6);

      // Grade badge
      const badgeColors = ['#64748b', '#3b82f6', '#0ea5e9', '#8b5cf6', '#059669'];
      this.doc.fillColor(badgeColors[grado - 1] || '#64748b');
      this.doc.rect(MARGIN + CONTENT_WIDTH - 80, boxY + 4, 72, 20).fill();
      this.doc.fillColor('#ffffff');
      this.doc.fontSize(9).font('Helvetica-Bold');
      this.doc.text(`Grado ${grado}`, MARGIN + CONTENT_WIDTH - 76, boxY + 7, { width: 64, align: 'center' });

      // Points line
      this.doc.fontSize(8).font('Helvetica').fillColor('#475569');
      const pointsText = `${puntos} pts — ${desc}`;
      this.doc.text(pointsText, MARGIN + 8, boxY + 32, { width: CONTENT_WIDTH - 16, align: 'left' });

      // Justification
      this.doc.fontSize(8.5).font('Helvetica').fillColor('#1e293b');
      const justY = boxY + 46;
      this.doc.text(just, MARGIN + 8, justY, justOpts);

      this.y = boxY + boxH + 8;
    }
  }

  private addConclusion(evaluacion: any, totalPuntos: number, procedimientos?: ProcedimientosContext): void {
    this.checkPage(120);
    this.addSectionTitle('6. Conclusión y Dictamen Técnico');

    const porcentaje = Math.round((totalPuntos / 1000) * 100);
    const clase = getClaseSugerida(totalPuntos);

    let categoria = '';
    let descripcion = '';

    if (porcentaje <= 20) {
      categoria = 'Nivel Operativo Básico';
      descripcion = 'Puesto con funciones simples, supervisión mínima o nula, y baja responsabilidad institucional. Las tareas son predominantemente operativas y repetitivas.';
    } else if (porcentaje <= 35) {
      categoria = 'Nivel Operativo Calificado';
      descripcion = 'Puesto con funciones estandarizadas, supervisión ocasional y responsabilidad moderada. Requiere conocimientos técnicos básicos para su ejecución.';
    } else if (porcentaje <= 50) {
      categoria = 'Nivel Técnico-Administrativo';
      descripcion = 'Puesto que requiere análisis técnico, supervisión de grupos operativos y manejo de información sensible. Implica toma de decisiones en su ámbito de competencia.';
    } else if (porcentaje <= 65) {
      categoria = 'Nivel Profesional';
      descripcion = 'Puesto con alta complejidad técnica, jefatura de unidad y responsabilidad por presupuestos. Requiere formación profesional especializada y experiencia comprobable.';
    } else if (porcentaje <= 80) {
      categoria = 'Nivel Directivo';
      descripcion = 'Puesto de dirección estratégica, toma de decisiones críticas y gestión de procesos clave. Responsabilidad directa sobre resultados institucionales.';
    } else {
      categoria = 'Nivel Superior / Alta Dirección';
      descripcion = 'Puesto de máxima responsabilidad institucional, dirección estratégica y gestión integral. Incide directamente en el cumplimiento de los fines municipales.';
    }

    this.doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3a5f');
    this.doc.text('Puntuación Obtenida:', MARGIN, this.y);
    this.y += 14;
    this.doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af');
    this.doc.text(`${totalPuntos} / 1000 pts (${porcentaje}%)`, MARGIN, this.y);
    this.y += 22;

    if (clase) {
      const esProhib = clase.nombre.includes('(Prohib.)');
      this.doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3a5f');
      this.doc.text('Clase Municipal Sugerida:', MARGIN, this.y);
      this.y += 14;
      this.doc.fontSize(12).font('Helvetica-Bold').fillColor('#047857');
      this.doc.text(`${clase.nombre}`, MARGIN, this.y);
      this.y += 16;
      this.doc.fontSize(9).font('Helvetica').fillColor('#475569');
      this.doc.text(`Serie: ${clase.serie}`, MARGIN, this.y);
      this.y += 14;
      if (esProhib) {
        this.doc.fontSize(8).font('Helvetica-Oblique').fillColor('#dc2626');
        this.doc.text('Nota: Esta clase tiene carácter restringido (Prohib.). Se recomienda validar con el departamento de RRHH.', MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify' });
        this.y += 12;
      }
    }

    this.checkPage(40);
    this.doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3a5f');
    this.doc.text('Categoría Asignada:', MARGIN, this.y);
    this.y += 14;
    this.doc.fontSize(11).font('Helvetica-Bold').fillColor('#047857');
    this.doc.text(categoria, MARGIN, this.y);
    this.y += 18;

    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    const descLines = this.doc.heightOfString(descripcion, { width: CONTENT_WIDTH, align: 'justify' });
    this.doc.text(descripcion, MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify' });
    this.y += descLines + 10;

    this.checkPage(40);
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e3a5f');
    this.doc.text('Dictamen Técnico:', MARGIN, this.y);
    this.y += 14;

    const motorTexto = !evaluacion.motor || evaluacion.motor === 'rule-based'
      ? 'motor de análisis basado en reglas'
      : 'agente de inteligencia artificial';

    const dictamenBase = `El puesto evaluado "${evaluacion.puesto?.nombre || ''}" ha sido analizado mediante la metodología MSC de Puntos por Factores, obteniendo una puntuación total de ${totalPuntos} puntos sobre 1000.`;
    const dictamenClase = clase
      ? ` Con base en esta puntuación, se sugiere su clasificación en la clase "${clase.nombre}" de la serie ${clase.serie}.`
      : '';
    const dictamenMotor = ` El análisis fue ejecutado por el ${motorTexto}${evaluacion.buildVersion ? ` (${evaluacion.buildVersion})` : ''}, garantizando la objetividad y trazabilidad del proceso.`;
    const dictamenProc = procedimientos
      ? ` Se consideraron ${procedimientos.totalProcedimientos} procedimientos operativos asociados al área del puesto como contexto adicional para la evaluación.`
      : '';

    const dictamen = `${dictamenBase}${dictamenClase}${dictamenMotor}${dictamenProc}`;
    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    const dictOpts = { width: CONTENT_WIDTH, align: 'justify' as const, lineGap: 3 };
    this.doc.text(dictamen, MARGIN, this.y, dictOpts);
    this.y += this.doc.heightOfString(dictamen, dictOpts) + 12;

    this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e3a5f');
    this.doc.text('Recomendaciones:', MARGIN, this.y);
    this.y += 14;

    let recomendaciones = '';
    if (porcentaje < 30) {
      recomendaciones = 'Se recomienda revisar la descripción de funciones para asegurar que refleje adecuadamente todas las responsabilidades del puesto. Evaluar la posibilidad de ajuste salarial conforme a la categoría asignada.';
    } else if (porcentaje < 50) {
      recomendaciones = 'Se recomienda formalizar los procedimientos operativos asociados al puesto y evaluar la consistencia salarial con puestos de categoría similar en la institución.';
    } else if (porcentaje < 70) {
      recomendaciones = 'Se recomienda realizar un análisis de mercado salarial para validar la competitividad de la categoría asignada. Documentar formalmente las funciones críticas del puesto.';
    } else {
      recomendaciones = 'Se recomienda asegurar que el puesto cuenta con las condiciones laborales y compensaciones adecuadas a su nivel de responsabilidad. Revisar la coherencia jerárquica con otros puestos de la institución.';
    }

    this.doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
    this.doc.text(recomendaciones, MARGIN, this.y, { width: CONTENT_WIDTH, align: 'justify' });
    this.y += this.doc.heightOfString(recomendaciones, { width: CONTENT_WIDTH, align: 'justify' }) + 16;
  }

  private addSignature(evaluacion: any): void {
    this.checkPage(160);
    this.y = Math.max(this.y, MAX_Y - 160);

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
    this.doc.text(`v${evaluacion.version || '28aa2ac'} — Generado automáticamente`, MARGIN, this.y);
    this.y += 20;

    this.doc.fontSize(7).font('Helvetica-Oblique').fillColor('#94a3b8');
    this.doc.text('Este informe ha sido generado automáticamente por el Agente Evaluador IA. Los resultados se basan en el análisis objetivo de la descripción de funciones del puesto según la metodología MSC de Puntos por Factores.', MARGIN, this.y, { width: CONTENT_WIDTH, align: 'center' });
  }

  generate(evaluacion: any): PDFKit.PDFDocument {
    const puesto = evaluacion.puesto || {};
    const totalPuntos = evaluacion.puntos_totales || 0;
    const procedimientos: ProcedimientosContext | undefined = evaluacion._procedimientos;

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
      'El análisis fue realizado por el Agente Evaluador IA, que aplica un proceso sistématico de evaluación técnica ' +
      'considerando: (a) la naturaleza y complejidad de las funciones descritas, (b) el contexto organizacional del puesto, ' +
      '(c) el nivel de autonomía y juicio requerido, y (d) el impacto de sus decisiones en la institución. ' +
      'Cada grado asignado se sustenta con evidencia textual de la descripción de funciones y, cuando están disponibles, ' +
      'de los procedimientos operativos asociados al área del puesto.' +
      (procedimientos
        ? ` Para este análisis se incorporaron ${procedimientos.totalProcedimientos} procedimientos operativos asociados al área del puesto como contexto adicional, permitiendo una evaluación más precisa de las tareas reales que ejecuta el puesto.`
        : '');
    const metOpts = { width: CONTENT_WIDTH, align: 'justify' as const, lineGap: 3 };
    const lines = this.doc.heightOfString(metodologiaText, metOpts);
    this.doc.text(metodologiaText, MARGIN, this.y, metOpts);
    this.y += lines + 12;

    if (procedimientos) {
      this.addProcedimientosBlock(procedimientos);
    }

    this.addSectionTitle('4. Resumen de Puntuación');
    this.addFactorsTable(evaluacion);

    this.addFactorDetail(evaluacion);

    this.addConclusion(evaluacion, totalPuntos, procedimientos);

    this.addSignature(evaluacion);

    this.doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
    this.doc.text(`— Fin del Informe —`, MARGIN, this.y, { align: 'center' });

    return this.doc;
  }
}

export function generateEvaluationReport(evaluacion: any, procedimientos?: ProcedimientosContext): PDFKit.PDFDocument {
  const generator = new ReportGenerator();
  if (procedimientos) {
    evaluacion._procedimientos = procedimientos;
  }
  return generator.generate(evaluacion);
}
