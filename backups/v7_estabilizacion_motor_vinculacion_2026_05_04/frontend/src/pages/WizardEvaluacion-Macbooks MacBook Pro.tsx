import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Save, FileText, CheckCircle2, Info, Download } from 'lucide-react';
import api from '../services/api';
import { EVALUACION_MATRIX } from '../constants/evaluacionMatrix';
import { getCategoriaByPuntos } from '../constants/categorias';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const WizardEvaluacion = () => {
  const [pasoActual, setPasoActual] = useState(() => {
    const saved = localStorage.getItem('wizard_pasoActual');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [puestos, setPuestos] = useState<any[]>([]);
  const [puestoIdSeleccionado, setPuestoIdSeleccionado] = useState(() => {
    return localStorage.getItem('wizard_puestoId') || '';
  });
  
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>(() => {
    const saved = localStorage.getItem('wizard_selections');
    return saved ? JSON.parse(saved) : {};
  });
  const [justificaciones, setJustificaciones] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('wizard_justificaciones');
    if (saved) return JSON.parse(saved);
    return {
      dificultad: '',
      supervision: '',
      responsabilidad: '',
      condiciones: '',
      consecuencia_error: '',
      requisitos: ''
    };
  });

  // Guardar estado en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('wizard_pasoActual', pasoActual.toString());
  }, [pasoActual]);

  useEffect(() => {
    localStorage.setItem('wizard_puestoId', puestoIdSeleccionado);
  }, [puestoIdSeleccionado]);

  useEffect(() => {
    localStorage.setItem('wizard_selections', JSON.stringify(selections));
  }, [selections]);

  useEffect(() => {
    localStorage.setItem('wizard_justificaciones', JSON.stringify(justificaciones));
  }, [justificaciones]);

  const clearSavedState = () => {
    localStorage.removeItem('wizard_pasoActual');
    localStorage.removeItem('wizard_puestoId');
    localStorage.removeItem('wizard_selections');
    localStorage.removeItem('wizard_justificaciones');
  };

  useEffect(() => {
    api.get('/puestos')
      .then(res => setPuestos(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (puestoIdSeleccionado && Object.keys(selections).length === 0) {
      const initial: any = {};
      EVALUACION_MATRIX.forEach(f => {
        initial[f.id] = {};
        f.subfactors.forEach(sf => {
          initial[f.id][sf.id] = -1;
        });
      });
      setSelections(initial);
    }
  }, [puestoIdSeleccionado, selections]);

  const handleSelectOption = (factorId: string, subfactorId: string, points: number, _desc: string) => {
    setSelections(prev => {
      const currentFactorSelections = prev[factorId] || {};
      const newFactorState = { ...currentFactorSelections, [subfactorId]: points };
      
      const currentJustif = justificaciones[factorId] || '';
      if (!currentJustif || currentJustif.includes('Criterios seleccionados:')) {
          const selectedDescs: string[] = [];
          const factorMeta = EVALUACION_MATRIX.find(f => f.id === factorId);
          factorMeta?.subfactors.forEach(sf => {
             const p = sf.id === subfactorId ? points : (currentFactorSelections[sf.id] || 0);
             const opt = sf.options.find(o => o.points === p);
             if (opt) selectedDescs.push(`${sf.name}: ${opt.description}`);
          });
          
          setJustificaciones(prevJ => ({
            ...prevJ,
            [factorId]: `Criterios seleccionados:\n- ${selectedDescs.join('\n- ')}`
          }));
      }

      return { ...prev, [factorId]: newFactorState };
    });
  };

  const getPointsByFactor = (factorId: string) => {
    const factorData = selections[factorId];
    if (!factorData) return 0;
    return Object.values(factorData).reduce((a, b) => a + (Number(b) || 0), 0);
  };

  const getGradoByPoints = (factorId: string, points: number) => {
    const factor = EVALUACION_MATRIX.find(f => f.id === factorId);
    const max = factor?.maxPoints || 150;
    const ratio = points / max;
    if (ratio <= 0.16) return 1;
    if (ratio <= 0.33) return 2;
    if (ratio <= 0.50) return 3;
    if (ratio <= 0.66) return 4;
    if (ratio <= 0.83) return 5;
    return 6;
  };

  const totalPuntosGlobal = useMemo(() => {
    return Object.keys(selections).reduce((acc, fId) => acc + getPointsByFactor(fId), 0);
  }, [selections]);

  const factorActualMeta = EVALUACION_MATRIX[pasoActual] || null;
  const esPasoResumen = pasoActual === EVALUACION_MATRIX.length;
  const puestoSeleccionado = puestos.find(p => p.id === puestoIdSeleccionado);

  const canContinue = useMemo(() => {
    if (esPasoResumen) return true;
    if (!factorActualMeta) return false;
    
    const factorId = factorActualMeta.id;
    const factorSelections = selections[factorId];
    if (!factorSelections) return false;
    
    const allSelected = factorActualMeta.subfactors.every(sf => factorSelections[sf.id] !== -1);
    const hasJustif = (justificaciones[factorId] || '').trim().length > 10;
    
    return allSelected && hasJustif;
  }, [pasoActual, selections, justificaciones, esPasoResumen, factorActualMeta]);

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(18);
      doc.text('Dictamen Técnico de Valoración de Puesto', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Municipalidad de San Carlos - Gestión de Talento Humano', pageWidth / 2, 28, { align: 'center' });
      doc.line(20, 32, pageWidth - 20, 32);

      doc.setFontSize(12);
      doc.text(`Puesto: ${puestoSeleccionado?.nombre || 'N/A'}`, 20, 45);
      doc.text(`Área: ${puestoSeleccionado?.area || 'N/A'}`, 20, 52);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 59);

      const tableData = EVALUACION_MATRIX.map(f => [
        f.name,
        `Grado ${getGradoByPoints(f.id, getPointsByFactor(f.id))}`,
        `${getPointsByFactor(f.id)} pts`
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['Factor de Evaluación (DGSC)', 'Nivel/Grado', 'Puntaje']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80] }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFontSize(14);
      doc.text(`PUNTAJE TOTAL: ${totalPuntosGlobal} / 1000 Puntos`, 20, finalY + 15);

      const categoria = getCategoriaByPuntos(totalPuntosGlobal);
      if (categoria) {
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.text(`Clasificación CAM sugerida: ${categoria.nombre}`, 20, finalY + 25);
      }
      doc.setTextColor(0, 0, 0);

      let currentY = finalY + 40;
      doc.setFontSize(12);
      doc.text('Sustento y Justificación Técnica:', 20, currentY);
      currentY += 10;
      doc.setFontSize(9);
      
      EVALUACION_MATRIX.forEach(f => {
         if (currentY > 260) { doc.addPage(); currentY = 20; }
         doc.setFont('helvetica', 'bold');
         doc.text(`${f.name}:`, 20, currentY);
         doc.setFont('helvetica', 'normal');
         const text = justificaciones[f.id] || 'Sin justificación adicional.';
         const splitText = doc.splitTextToSize(text, pageWidth - 40);
         doc.text(splitText, 25, currentY + 5);
         currentY += (splitText.length * 5) + 12;
      });

      doc.save(`Dictamen_Valoracion_${(puestoSeleccionado?.nombre || 'puesto').replace(/\s/g, '_')}.pdf`);
    } catch (e) {
      console.error('PDF Error:', e);
      alert('Error generando PDF. Consulte la consola.');
    }
  };

  const handleSubmit = async () => {
    try {
      const payload: any = {
        puesto_id: puestoIdSeleccionado,
        puntos_totales: totalPuntosGlobal,
      };

      EVALUACION_MATRIX.forEach(f => {
        const pts = getPointsByFactor(f.id);
        payload[f.id] = {
          grado: getGradoByPoints(f.id, pts),
          puntos: pts,
          justificacion: justificaciones[f.id]
        };
      });

      await api.post('/evaluaciones', payload);
      clearSavedState();
      alert('¡Evaluación Normativa DGSC Finalizada y Guardada!');
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert('Error guardando en BD');
    }
  };

  if (!puestoIdSeleccionado) {
    return (
      <div className="bg-card border rounded-lg p-6 max-w-xl mx-auto mt-10">
        <h2 className="text-xl font-bold mb-2">Evaluación Técnica de Puestos</h2>
        <p className="text-sm text-muted-foreground mb-6">Metodología de Puntos por Factor (Estándar Servicio Civil / San Carlos).</p>
        <div className="space-y-4">
             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Seleccione Ficha para Valuación</label>
             <select 
              className="w-full h-12 px-3 text-sm rounded-md border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background font-medium text-foreground"
              value={puestoIdSeleccionado}
              onChange={(e) => setPuestoIdSeleccionado(e.target.value)}
            >
              <option value="">-- Listado Institucional --</option>
              {puestos.map(p => (
                 <option key={p.id} value={p.id}>{p.nombre} ({p.area})</option>
              ))}
            </select>
            
            {(localStorage.getItem('wizard_puestoId') || localStorage.getItem('wizard_pasoActual') !== '0') && (
              <button 
                onClick={() => {
                  if(window.confirm('¿Desea descartar el avance guardado y empezar desde cero?')) {
                    clearSavedState();
                    setPasoActual(0);
                    setPuestoIdSeleccionado('');
                    setSelections({});
                    setJustificaciones({
                      dificultad: '', supervision: '', responsabilidad: '',
                      condiciones: '', consecuencia_error: '', requisitos: ''
                    });
                  }
                }}
                className="mt-4 text-xs text-destructive hover:underline font-medium"
              >
                Descartar evaluación en progreso y empezar de nuevo
              </button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-card border rounded-lg shadow-sm p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{puestoSeleccionado?.nombre || 'Cargando...'}</h2>
            <div className="text-xs text-muted-foreground flex gap-2">
              <span className="font-mono">{puestoIdSeleccionado.split('-')[0]}</span> | 
              <span className="font-semibold uppercase text-primary/70">{puestoSeleccionado?.area}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Puntaje Auditoría</p>
           <div className="text-2xl font-black text-foreground">
             {totalPuntosGlobal} <span className="text-xs text-muted-foreground font-normal">/ 1000</span>
           </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm flex flex-col min-h-[600px] overflow-hidden">
        <div className="flex overflow-x-auto border-b bg-muted/20">
          {EVALUACION_MATRIX.map((f, i) => (
            <div key={f.id} className={`flex-1 min-w-[120px] py-4 px-2 text-center border-b-2 transition-all ${pasoActual === i ? 'border-primary bg-background' : 'border-transparent'}`}>
               <div className={`text-[10px] uppercase font-bold mb-1 ${pasoActual === i ? 'text-primary' : 'text-muted-foreground'}`}>Factor {i+1}</div>
               <div className={`text-xs font-bold truncate ${pasoActual === i ? 'text-foreground' : 'text-muted-foreground'}`}>{(f.name.split('. ')[1] || f.name)}</div>
            </div>
          ))}
          <div className={`flex-1 min-w-[120px] py-4 px-2 text-center border-b-2 transition-all ${pasoActual === EVALUACION_MATRIX.length ? 'border-primary bg-background' : 'border-transparent'}`}>
             <div className="text-[10px] uppercase font-bold mb-1 text-muted-foreground">Envío</div>
             <div className="text-xs font-bold text-muted-foreground">Resumen</div>
          </div>
        </div>

        <div className="p-8 flex-1">
          {factorActualMeta && !esPasoResumen ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div>
                 <h3 className="text-2xl font-bold text-foreground mb-2">{factorActualMeta.name}</h3>
                 <p className="text-sm text-muted-foreground border-l-4 border-primary/20 pl-4 italic">{factorActualMeta.description}</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-10">
                    {factorActualMeta.subfactors.map(sf => (
                      <div key={sf.id} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                             <CheckCircle2 size={16} className={(selections[factorActualMeta.id]?.[sf.id] !== -1) ? 'text-green-500' : 'text-muted-foreground'} />
                             {sf.name}
                          </label>
                          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{selections[factorActualMeta.id]?.[sf.id] === -1 ? 0 : selections[factorActualMeta.id]?.[sf.id]} pts</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {sf.options.map((opt, idx) => {
                            const isSelected = (selections[factorActualMeta.id]?.[sf.id] || 0) === opt.points;
                            return (
                              <button key={idx} onClick={() => handleSelectOption(factorActualMeta.id, sf.id, opt.points, opt.description)} 
                                className={`group relative py-3 rounded-md border text-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'bg-background hover:border-primary/50 text-muted-foreground'}`}>
                                <span className="text-xs font-bold">{idx + 1}</span>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-foreground text-background text-[10px] rounded shadow-xl z-50 pointer-events-none">
                                  <strong>{opt.label}</strong>: {opt.description}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-6">
                     <div className="bg-muted/30 rounded-lg p-5 border border-dashed text-sm flex gap-3 text-foreground">
                        <Info size={20} className="text-primary shrink-0" />
                        <div>
                          <p className="font-bold mb-2 underline decoration-primary/30">Justificación del Auditor</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">Sustente su elección técnica según el Manual Descriptivo.</p>
                        </div>
                     </div>
                     <textarea placeholder="Sustento legal..." className="w-full flex-1 p-4 text-sm font-medium rounded-md border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[200px] resize-none"
                       value={justificaciones[factorActualMeta.id]} onChange={(e) => setJustificaciones({...justificaciones, [factorActualMeta.id]: e.target.value})}></textarea>
                  </div>
               </div>
            </div>
          ) : esPasoResumen ? (
            <div className="flex-1 max-w-2xl mx-auto space-y-10 py-4 animate-in zoom-in duration-300">
               <div className="text-center">
                 <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                 <h3 className="text-2xl font-bold text-foreground">Revisión Final DGSC</h3>
               </div>
               <div className="bg-muted/20 border rounded-xl overflow-hidden">
                 {EVALUACION_MATRIX.map(f => (
                   <div key={f.id} className="flex justify-between items-center px-6 py-4 border-b last:border-0 hover:bg-muted/10 transition-colors">
                     <div>
                       <div className="text-sm font-bold text-foreground">{(f.name.split('. ')[1] || f.name)}</div>
                       <div className="text-[10px] text-muted-foreground font-semibold uppercase">Grado {getGradoByPoints(f.id, getPointsByFactor(f.id))}</div>
                     </div>
                     <div className="font-mono font-bold text-lg text-foreground">{getPointsByFactor(f.id)} <span className="text-[10px] font-normal text-muted-foreground ml-1">pts</span></div>
                   </div>
                 ))}
                 <div className="bg-primary/10 px-6 py-5 flex justify-between items-center text-primary">
                    <span className="font-black tracking-widest uppercase">Puntaje Total Final</span>
                    <span className="text-3xl font-black">{totalPuntosGlobal} / 1000</span>
                 </div>
                 
                 {/* Sugerencia de Categoría CAM */}
                 {(() => {
                   const cat = getCategoriaByPuntos(totalPuntosGlobal);
                   return cat ? (
                     <div className={`mx-6 my-4 p-4 border rounded-lg flex items-center justify-between ${cat.color} animate-in slide-in-from-right-4 duration-500`}>
                        <div className="flex gap-3 items-center">
                          <CheckCircle2 size={24} />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Clasificación CAM Sugerida</p>
                            <p className="text-lg font-bold">{cat.nombre}</p>
                          </div>
                        </div>
                        <p className="text-xs italic opacity-80">{cat.descripcion}</p>
                     </div>
                   ) : (
                     <div className="mx-6 my-4 p-4 border rounded-lg bg-slate-50 text-slate-500 border-slate-200">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70">Clasificación Sugerida</p>
                        <p className="text-sm font-medium italic">Puesto Operativo / Técnico ( &lt; 480 pts )</p>
                     </div>
                   );
                 })()}
               </div>
               <div className="flex justify-center pt-4">
                  <button onClick={downloadPDF} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary text-primary rounded-md font-bold hover:bg-primary/5 transition-all">
                    <Download size={20} /> Descargar Dictamen Técnico (PDF)
                  </button>
               </div>
            </div>
          ) : null}
        </div>

        <div className="p-6 px-10 border-t bg-muted/30 flex justify-between items-center">
          <button disabled={pasoActual === 0} onClick={() => setPasoActual(p => Math.max(0, p - 1))} className="flex items-center gap-2 px-5 py-2.5 border bg-background text-foreground rounded-md disabled:opacity-50 text-sm font-bold hover:bg-muted transition-all">
            <ChevronLeft size={18} /> Anterior
          </button>
          {!esPasoResumen ? (
            <button onClick={() => setPasoActual(p => Math.min(EVALUACION_MATRIX.length, p + 1))} disabled={!canContinue} className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-md disabled:opacity-40 text-sm font-bold hover:opacity-90 transition-all">
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
             <button onClick={handleSubmit} className="flex items-center gap-2 px-8 py-2.5 bg-foreground text-background rounded-md text-sm font-bold hover:opacity-90 transition-all shadow-xl">
              <Save size={18} /> Finalizar Valoración
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WizardEvaluacion;
