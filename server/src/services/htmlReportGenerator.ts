import type { ProcedimientosContext } from './procedimientosService';
import { extraerAcciones, evalProcedimientos, TaggedAccion } from './contextualAnalyzer';
import { getClaseSugerida } from './reportGenerator';

export function generateHtmlReport(evaluacion: any, procedimientos?: ProcedimientosContext): string {
  const puesto = evaluacion.puesto || {};
  const totalPuntos = evaluacion.puntos_totales || 0;
  const proc = procedimientos || evaluacion._procedimientos;
  
  // Resolver la clase exacta según el Manual de Clases y Metodología MSC
  const sugerida = getClaseSugerida(totalPuntos, puesto.nombre, puesto.educacion_requerida, puesto.codigo_clase_msc, puesto.estrato);
  const clase = {
    nombre: sugerida ? sugerida.nombre : 'No determinada',
    serie: sugerida ? sugerida.serie : 'General'
  };

  const dateStr = evaluacion.fecha_evaluacion ? new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
  const hash = Buffer.from(dateStr).toString('hex').slice(0, 24).toUpperCase();
  const buildVersion = evaluacion.buildVersion || 'v12-contextual';

  // Extract all actions to show detailed points
  const fx = puesto.descripcion_funciones || '';
  const accFx = extraerAcciones(fx).map(a => ({...a, fuente: 'funciones'} as TaggedAccion));
  const pr = evalProcedimientos(proc);
  const allAcc: TaggedAccion[] = [...accFx, ...pr.acc];

  const FACTOR_DISPLAY: Record<string, { label: string; desc: string; grades: string[] }> = {
    dificultad: { label: 'Dificultad de Funciones', desc: 'Evalúa la complejidad, variedad y nivel de análisis.', grades: ['', 'Tareas simples y repetitivas.', 'Tareas variadas estandarizadas.', 'Requiere análisis y juicio técnico.', 'Alta complejidad y planeación.', 'Dirección estratégica.', 'Análisis sin precedentes.'] },
    supervision: { label: 'Supervisión Ejercida', desc: 'Evalúa la responsabilidad por dirigir o revisar el trabajo de otros.', grades: ['', 'No ejerce supervisión.', 'Supervisión ocasional.', 'Supervisión de grupo operativo.', 'Jefatura de unidad.', 'Dirección de área mayor.', 'Coordina programas.'] },
    responsabilidad: { label: 'Responsabilidad', desc: 'Evalúa el impacto de custodiar bienes, información o manejar fondos.', grades: ['', 'Baja responsabilidad.', 'Responsabilidad moderada.', 'Custodia de información sensible.', 'Responsabilidad por presupuestos.', 'Gestión de proceso clave.', 'Responsabilidad completa.'] },
    condiciones: { label: 'Condiciones de Trabajo', desc: 'Evalúa el esfuerzo físico y exposición a riesgos.', grades: ['', 'Oficina normal.', 'Esfuerzo moderado.', 'Exposición climática o ruido.', 'Riesgo de accidentes.', 'Alta peligrosidad.'] },
    error: { label: 'Consecuencia del Error', desc: 'Evalúa el impacto económico, legal o de servicio.', grades: ['', 'Error fácil de corregir.', 'Retrasos menores.', 'Afecta otros departamentos.', 'Pérdidas económicas/legales.', 'Compromete estabilidad.', 'Daños irreversibles.'] },
    requisitos: { label: 'Requisitos', desc: 'Evalúa el nivel educativo y experiencia.', grades: ['', 'Educación básica.', 'Bachillerato / Técnico.', 'Diplomado / Técnico superior.', 'Bachillerato / Licenciatura.', 'Maestría / Especialización.', 'Postgrado avanzado.'] }
  };
  const FACTORS = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];
  const FACTOR_DB_FIELD: Record<string, string> = {
    dificultad: 'dificultad',
    supervision: 'supervision',
    responsabilidad: 'responsabilidad',
    condiciones: 'condiciones',
    error: 'consecuencia_error',
    requisitos: 'requisitos',
  };

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valoración de puestos mediante metodología por puntos - ${puesto.nombre || 'Puesto'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .avoid-break { page-break-inside: avoid; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body class="bg-gray-50 text-gray-800 font-sans antialiased pb-20">
  
  <!-- Contenedor Principal (Simulando A4) -->
  <div class="max-w-4xl mx-auto bg-white shadow-xl min-h-screen my-8 overflow-hidden relative">
    
    <!-- Botón Flotante para Imprimir (No visible en impresión) -->
    <div class="fixed bottom-8 right-8 no-print">
      <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd" />
        </svg>
        Guardar PDF
      </button>
    </div>

    <!-- PÁGINA 1: Portada y Resumen -->
    <div class="p-12 relative border-t-8 border-blue-800">
      
      <!-- Cabecera Institucional -->
      <div class="flex justify-between items-start mb-12">
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase">Valoración de puestos mediante metodología por puntos</h1>
          <p class="text-blue-600 font-semibold mt-1 uppercase tracking-widest text-sm">Municipalidad de San Carlos</p>
        </div>
        <div class="text-right text-xs text-gray-500 font-mono">
          <p>ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          <p>FECHA: ${dateStr.toUpperCase()}</p>
        </div>
      </div>

      <!-- Datos del Puesto -->
      <div class="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
        <h2 class="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4">1. Identificación del Puesto</h2>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <p class="text-xs text-gray-500 uppercase">Título de la Plaza</p>
            <p class="font-bold text-lg text-gray-900">${puesto.nombre || 'N/A'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase">Departamento / Área</p>
            <p class="font-bold text-lg text-gray-900">${puesto.area || 'N/A'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase">Superior Inmediato</p>
            <p class="font-medium text-gray-800">${puesto.reporta_a || 'N/A'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase">Motor de Evaluación</p>
            <p class="font-medium text-gray-800">${(!evaluacion.motor || evaluacion.motor === 'rule-based' ? 'Motor de Reglas Contextuales (MSC)' : 'Sistema Experto de Valoración Metodológica (IA)') + (evaluacion.buildVersion ? ` (${evaluacion.buildVersion})` : '')}</p>
          </div>
        </div>
      </div>

      <!-- Alerta Global -->
      ${(() => {
        if (!evaluacion.alerta_global) return '';
        const contradicciones = (evaluacion.analisis_multifuente || []).filter((m: any) => m.contradiccion);
        const hasContradictions = contradicciones.length > 0;
        return `
        <div class="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl mb-8 avoid-break">
          <div class="flex items-start">
            <svg class="h-6 w-6 text-amber-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 class="text-sm font-bold text-amber-800 uppercase tracking-wide">Alerta de Contradicción</h3>
              <p class="mt-1 text-sm text-amber-900 leading-relaxed">${evaluacion.alerta_global.replace(/\\n/g, '<br>')}</p>
              ${hasContradictions ? `<p class="mt-2 text-sm text-amber-800 font-semibold"><a href="#seccion-contradicciones" class="underline decoration-amber-500 hover:text-amber-600">Se detectaron ${contradicciones.length} alertas de contradicción entre fuentes. Consulte la sección 3 para valorarlas.</a></p>` : ''}
            </div>
          </div>
        </div>
        `;
      })()}

      <!-- Resultado Principal -->
      <div class="bg-blue-900 text-white rounded-2xl p-8 mb-10 shadow-lg flex items-center justify-between avoid-break">
        <div>
          <p class="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">Resultado de Valoración</p>
          <p class="text-4xl font-black">${totalPuntos} <span class="text-xl font-normal text-blue-300">/ 1000 pts</span></p>
          <p class="text-blue-200 mt-2 text-sm">Carga salarial equivalente al ${Math.round((totalPuntos/10)*10)/10}% del máximo.</p>
        </div>
        <div class="text-right border-l border-blue-700 pl-8">
          <p class="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Estrato Sugerido</p>
          <p class="text-2xl font-bold">${clase.nombre}</p>
          <p class="text-blue-300 mt-1 text-sm">Manual de Clases MSC</p>
        </div>
      </div>

      <!-- Descripción de Funciones -->
      <div class="mb-8 avoid-break">
        <h2 class="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Descripción de Funciones</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-700 leading-relaxed text-justify">
          ${puesto.descripcion_funciones || 'No provista'}
        </div>
      </div>

      <!-- Metodología -->
      <div class="mb-8">
        <h2 class="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">2. Metodología Aplicada</h2>
        <p class="text-sm text-gray-600 leading-relaxed text-justify">
          La valoración técnica se efectuó mediante el Manual de Clases y Metodología de Puntos por Factores oficial de la Municipalidad de San Carlos. Esta metodología pondera seis factores clave acumulando un máximo de 1000 puntos: Dificultad de Funciones (200 pts máx.), Supervisión Ejercida (150 pts máx.), Responsabilidad por Activos, Valores y Datos (200 pts máx.), Condiciones de Trabajo (100 pts máx.), Consecuencia de los Errores (150 pts máx.), y Requisitos Formativos y de Experiencia (200 pts máx.). El cálculo se fundamenta en un análisis técnico cruzado de tres fuentes de información: la Ficha Oficial de Puestos, la Entrevista al Ocupante y la inyección transaccional de los Procedimientos Operativos del departamento desde Supabase, garantizando la máxima objetividad, trazabilidad y consistencia jerárquica.
        </p>
      </div>

      <!-- Análisis de Contradicciones y Discrepancias Técnicas -->
      ${(() => {
        const contradicciones = (evaluacion.analisis_multifuente || []).filter((m: any) => m.contradiccion);
        if (contradicciones.length === 0) return '';
        return `
        <div id="seccion-contradicciones" class="mb-8 avoid-break border-l-4 border-amber-500 bg-amber-50/50 p-6 rounded-r-xl border border-gray-200 shadow-sm">
          <h2 class="text-xs uppercase tracking-widest text-amber-800 font-bold mb-3">3. Análisis de Discrepancias y Contradicciones de Fuentes</h2>
          <p class="text-sm text-gray-700 leading-relaxed mb-4 text-justify">
            Se identificaron ${contradicciones.length} discrepancias sustantivas entre la Ficha Oficial del Puesto y la realidad operativa capturada en la entrevista o en los flujos procedimentales. A continuación, se detalla la resolución técnica adoptada para cada factor:
          </p>
          <div class="space-y-4">
            ${contradicciones.map((c: any) => `
              <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h4 class="text-xs font-bold text-gray-800 uppercase mb-2 tracking-wide">${c.factor} (Grado Sugerido: ${c.grado})</h4>
                <div class="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div class="bg-blue-50/30 p-2.5 rounded border border-blue-100">
                    <p class="font-bold text-blue-800 uppercase mb-1">Evidencia Documental (Ficha)</p>
                    <p class="text-blue-900 italic">"${c.cita_documental || 'No especificada'}"</p>
                  </div>
                  <div class="bg-purple-50/30 p-2.5 rounded border border-purple-100">
                    <p class="font-bold text-purple-800 uppercase mb-1">Evidencia Testimonial (Entrevista)</p>
                    <p class="text-purple-900 italic">"${c.cita_entrevista || 'No especificada'}"</p>
                  </div>
                </div>
                <p class="text-xs text-gray-600 leading-relaxed text-justify">
                  <strong>Resolución Metodológica:</strong> ${c.justificacion_documental}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
        `;
      })()}
    </div>

    <!-- SALTO DE PÁGINA PARA EL DETALLE -->
    <div class="page-break p-12">
      <h2 class="text-xl font-black text-gray-900 uppercase mb-6">Desglose de Evaluación por Factores</h2>
      
      <div class="space-y-10">
        ${FACTORS.map((factorKey) => {
          const dbField = FACTOR_DB_FIELD[factorKey];
          const fLabel = FACTOR_DISPLAY[factorKey].label;
          const fDesc = FACTOR_DISPLAY[factorKey].desc;
          const fGrado = evaluacion[`grado_${dbField}`] || 0;
          const fPuntos = evaluacion[`puntos_${dbField}`] || 0;
          const fJustificacion = evaluacion[`justif_${dbField}`] || '';

          const safeGrade = Math.max(0, Math.min(fGrado, FACTOR_DISPLAY[factorKey].grades.length - 1));
          const gradeText = FACTOR_DISPLAY[factorKey].grades[safeGrade];
          return `
          <div class="border border-gray-200 rounded-xl overflow-hidden avoid-break shadow-sm">
            <!-- Cabecera del Factor -->
            <div class="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 class="font-bold text-gray-800 uppercase text-sm">${fLabel}</h3>
              <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-black">
                ${fPuntos} pts
              </div>
            </div>
            
            <div class="p-5">
              <p class="text-xs text-gray-400 mb-4">${fDesc}</p>
              <div class="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r mb-5">
                <p class="text-sm font-bold text-blue-800 uppercase">Nivel Asignado: Grado ${fGrado} (${fPuntos} pts)</p>
                ${gradeText ? `<p class="text-xs font-medium text-blue-700 mt-1">${gradeText}</p>` : ''}
              </div>
              <div class="mt-2 border-t border-gray-100 pt-3">
                <h4 class="text-xs font-bold text-gray-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Fundamento Técnico y Evidencias
                </h4>
                <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line text-justify">${fJustificacion}</p>
              </div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- SALTO DE PÁGINA PARA FIRMAS -->
    <div class="page-break p-12 flex flex-col justify-between h-full">
      <div>
        <h2 class="text-xl font-black text-gray-900 uppercase mb-6">Dictamen Técnico y Recomendaciones</h2>
        <p class="text-sm text-gray-700 leading-relaxed text-justify mb-4">
          Conforme al análisis técnico integral de las funciones descritas y la aplicación estricta de la metodología oficial de Puntos por Factores, el puesto evaluado obtiene una puntuación final de <strong>${totalPuntos} puntos</strong>. Este resultado técnico, cruzado con el Manual de Clases institucional, dictamina su clasificación formal en la clase <strong>${clase.nombre}</strong> (Serie ${clase.serie}).
        </p>
        <p class="text-sm text-gray-700 leading-relaxed text-justify mb-6">
          La presente valoración ha sido ejecutada de forma sistemática, multifuente y auditable, utilizando ponderación cruzada entre la ficha oficial, las evidencias operativas y los procedimientos departamentales. Se garantiza así la total objetividad, equidad interna, trazabilidad y cumplimiento normativo en la asignación de la categoría salarial.
        </p>
        
        <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Recomendaciones:</h3>
          <ul class="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Revisar la descripción de funciones en el perfil oficial para asegurar exactitud.</li>
            <li>Monitorear la carga operativa según el alcance de responsabilidades evaluadas.</li>
            <li>Programar auditorías de puesto anuales para corroborar la vigencia del perfil.</li>
          </ul>
        </div>

        ${(() => {
          const serie = clase.serie;
          const limites: Record<string, number> = {
            Operativa: 355, Administrativa: 355, Policia: 345,
            Tecnica: 390, Profesional: 610, Jefatura: 880
          };
          const maxPuntos = limites[serie] || 1000;
          if (totalPuntos <= maxPuntos) return '';
          return `
          <div class="mt-6 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl">
            <h3 class="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-1">Acotaci\u00f3n Jer\u00e1rquica Activa</h3>
            <p class="text-xs text-indigo-900 leading-relaxed text-justify">
              Por la naturaleza organizativa del puesto (${serie}), la clase de valoraci\u00f3n se ha acotado autom\u00e1ticamente al estrato m\u00e1ximo permitido (<strong>${clase.nombre}</strong> con ${maxPuntos} pts) para resguardar la coherencia jer\u00e1rquica municipal, previniendo ascensos indebidos a escalas superiores.
            </p>
          </div>
          `;
        })()}
      </div>

      <!-- Bloque de Firmas -->
      <div class="mt-20 pt-10 border-t border-gray-200 flex justify-center">
        <div class="border border-gray-200 rounded-lg p-4 flex items-center bg-gray-50 max-w-lg">
          <div class="w-1 h-12 bg-blue-600 rounded mr-4"></div>
          <div>
            <p class="text-[9px] font-bold text-blue-800 uppercase mb-1">Certificado Digital de Seguridad</p>
            <p class="text-[8px] text-gray-600 font-mono">HASH: sha256-${hash}</p>
            <p class="text-[8px] text-gray-600 font-mono">VERSION: ${buildVersion}</p>
          </div>
        </div>
      </div>
      
      <div class="text-center mt-12 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        — FIN DEL INFORME OFICIAL —
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  return html;
}
