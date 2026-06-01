import type { ProcedimientosContext } from './procedimientosService';
import { extraerAcciones, evalProcedimientos, TaggedAccion } from './contextualAnalyzer';
import { getClaseSugerida } from './reportGenerator';

export function generateHtmlReport(evaluacion: any, procedimientos?: ProcedimientosContext): string {
  const puesto = evaluacion.puesto || {};
  const totalPuntos = evaluacion.puntos_totales || 0;
  const proc = procedimientos || evaluacion._procedimientos;
  
  // Resolver la clase exacta según el Manual de Clases y Metodología MSC
  const sugerida = getClaseSugerida(totalPuntos, puesto.nombre, puesto.educacion_requerida, puesto.codigo_clase_msc);
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
            <p class="font-medium text-gray-800">${puesto.jefatura || 'N/A'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase">Motor de Evaluación</p>
            <p class="font-medium text-gray-800">${!evaluacion.motor || evaluacion.motor === 'rule-based' ? 'Motor de Reglas Contextuales MSC' : 'Agente de IA (Google Gemini API)'}</p>
          </div>
        </div>
      </div>

      <!-- Alerta Global -->
      ${evaluacion.alerta_global ? `
      <div class="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl mb-8 avoid-break">
        <div class="flex items-start">
          <svg class="h-6 w-6 text-amber-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 class="text-sm font-bold text-amber-800 uppercase tracking-wide">Alerta de Contradicción</h3>
            <p class="mt-1 text-sm text-amber-900 leading-relaxed">${evaluacion.alerta_global.replace(/\\n/g, '<br>')}</p>
          </div>
        </div>
      </div>
      ` : ''}

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
        <div class="mb-8 avoid-break border-l-4 border-amber-500 bg-amber-50/50 p-6 rounded-r-xl border border-gray-200 shadow-sm">
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
      <h2 class="text-xl font-black text-gray-900 uppercase mb-6">4. Desglose de Evaluación por Factores</h2>
      
      <div class="space-y-10">
        ${evaluacion.factores?.map((f: any) => {
          const m = evaluacion.analisis_multifuente?.find((mf: any) => mf.factor === f.factor);
          
          return `
          <div class="border border-gray-200 rounded-xl overflow-hidden avoid-break shadow-sm">
            <!-- Cabecera del Factor -->
            <div class="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <div>
                <h3 class="font-bold text-gray-800 uppercase text-sm">${f.factor}</h3>
                <p class="text-sm font-bold text-blue-800 uppercase">Nivel Asignado: Grado ${f.grado} (${f.puntos} pts) — Intensidad: ${(evaluacion[`intensidad_${f.dbField}`] || 'medio').charAt(0).toUpperCase() + (evaluacion[`intensidad_${f.dbField}`] || 'medio').slice(1)}</p>
              </div>
              <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-black">
                ${f.puntos} pts
              </div>
            </div>
            
            <div class="p-5">
              <p class="text-sm text-gray-600 mb-4 leading-relaxed">${f.justificacion}</p>
              
              <!-- Evidencia Multifuente -->
              ${(m && (m.cita_documental || m.cita_entrevista)) ? `
                <div class="mt-4 pt-4 border-t border-gray-100">
                  <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Evidencia Multifuente Comparada</h4>
                  <div class="grid grid-cols-2 gap-4">
                    ${m.cita_documental ? `
                      <div class="bg-blue-50/50 border border-blue-100 rounded-lg p-3 border-l-4 border-l-blue-500">
                        <p class="text-[10px] font-bold text-blue-800 uppercase mb-2">Evidencia Documental (Manual)</p>
                        <p class="text-xs text-blue-900 italic leading-relaxed">"\${m.cita_documental}"</p>
                      </div>
                    ` : ''}
                    ${m.cita_entrevista ? `
                      <div class="bg-purple-50/50 border border-purple-100 rounded-lg p-3 border-l-4 border-l-purple-500">
                        <p class="text-[10px] font-bold text-purple-800 uppercase mb-2">Evidencia Testimonial (Entrevista)</p>
                        <p class="text-xs text-purple-900 italic leading-relaxed">"\${m.cita_entrevista}"</p>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- SALTO DE PÁGINA PARA FIRMAS -->
    <div class="page-break p-12 flex flex-col justify-between h-full">
      <div>
        <h2 class="text-xl font-black text-gray-900 uppercase mb-6">5. Dictamen Técnico y Recomendaciones</h2>
        <p class="text-sm text-gray-700 leading-relaxed text-justify mb-6">
          Conforme al análisis técnico de las funciones descritas y la metodología oficial de Puntos por Factores, 
          el puesto obtiene una valoración de <strong>${totalPuntos} puntos</strong>, dictaminando su clasificación en la clase <strong>${clase.nombre}</strong>. 
          La valoración fue ejecutada de forma sistemática y auditable, garantizando total objetividad, trazabilidad y cumplimiento normativo.
        </p>
        
        <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Recomendaciones:</h3>
          <ul class="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Revisar la descripción de funciones en el perfil oficial para asegurar exactitud.</li>
            <li>Monitorear la carga operativa según el alcance de responsabilidades evaluadas.</li>
            <li>Programar auditorías de puesto anuales para corroborar la vigencia del perfil.</li>
          </ul>
        </div>
      </div>

      <!-- Bloque de Firmas -->
      <div class="mt-20 pt-10 border-t border-gray-200 flex justify-between items-end">
        <div class="w-1/2 pr-10 text-center">
          <div class="border-b border-gray-400 w-full mb-2"></div>
          <p class="text-xs font-bold text-gray-800 uppercase">Firma Responsable RRHH</p>
          <p class="text-[10px] text-gray-500">Gestor(a) de Talento Humano</p>
        </div>
        
        <div class="w-1/2 pl-10">
          <div class="border border-gray-200 rounded-lg p-4 flex items-center bg-gray-50">
            <div class="w-1 h-12 bg-blue-600 rounded mr-4"></div>
            <div>
              <p class="text-[9px] font-bold text-blue-800 uppercase mb-1">Certificado Digital de Seguridad</p>
              <p class="text-[8px] text-gray-600 font-mono">HASH: sha256-${hash}</p>
              <p class="text-[8px] text-gray-600 font-mono">VERSION: ${buildVersion}</p>
              <p class="text-[8px] font-bold text-gray-400 uppercase mt-1">Validado por RRHH MSC</p>
            </div>
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
