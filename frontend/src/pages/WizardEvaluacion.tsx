import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Info, ShieldAlert, FileText, Save, Download, RotateCcw, Loader2, Target, Thermometer, GraduationCap, Briefcase } from 'lucide-react';
import api from '../services/api';
import { getEstratoCompleto } from '../constants/categorias';
import type { EstratoResult } from '../constants/categorias';

const FACTORS_CONFIG = [
  { key: 'dificultad', label: 'Dificultad de Funciones', icon: Target, points: [0, 40, 80, 120, 160, 200], maxPts: 200, desc: 'Complejidad de las tareas, iniciativa y juicio requerido.', grades: ['', 'Tareas simples y repetitivas.', 'Tareas variadas estandarizadas.', 'Requiere análisis y juicio técnico.', 'Alta complejidad y planeación.', 'Dirección estratégica y decisiones críticas.'] },
  { key: 'supervision', label: 'Supervisión Ejercida', icon: Briefcase, points: [0, 30, 60, 90, 120, 150], maxPts: 150, desc: 'Cantidad y nivel de personal bajo su cargo.', grades: ['', 'No ejerce supervisión.', 'Supervisión ocasional.', 'Supervisión de grupo operativo.', 'Jefatura de unidad.', 'Dirección de área mayor.'] },
  { key: 'responsabilidad', label: 'Responsabilidad', icon: ShieldAlert, points: [0, 40, 80, 120, 160, 200], maxPts: 200, desc: 'Responsabilidad por valores, equipo o información.', grades: ['', 'Baja responsabilidad.', 'Responsabilidad moderada.', 'Custodia de información sensible.', 'Responsabilidad por presupuestos.', 'Gestión de proceso clave.'] },
  { key: 'condiciones', label: 'Condiciones de Trabajo', icon: Thermometer, points: [0, 20, 40, 60, 80, 100], maxPts: 100, desc: 'Exposición a riesgos y esfuerzo físico.', grades: ['', 'Oficina normal.', 'Esfuerzo moderado.', 'Exposición climática o ruido.', 'Riesgo de accidentes.', 'Alta peligrosidad.'] },
  { key: 'error', label: 'Consecuencia del Error', icon: AlertTriangle, points: [0, 30, 60, 90, 120, 150], maxPts: 150, desc: 'Gravedad del daño institucional por error.', grades: ['', 'Error fácil de corregir.', 'Retrasos menores.', 'Afecta otros departamentos.', 'Pérdidas económicas/legales.', 'Compromete estabilidad.'] },
  { key: 'requisitos', label: 'Requisitos', icon: GraduationCap, points: [0, 40, 80, 120, 160, 200], maxPts: 200, desc: 'Nivel académico y experiencia requerida.', grades: ['', 'Educación básica.', 'Bachillerato / Técnico.', 'Diplomado / Técnico superior.', 'Bachillerato / Licenciatura.', 'Maestría / Especialización.'] }
];

const POINTS_MAP: Record<string, number[]> = Object.fromEntries(FACTORS_CONFIG.map(f => [f.key, f.points]));

function linearPts(grado: number, maxPts: number): number {
  return Math.round(maxPts * (Math.max(1, Math.min(5, grado)) - 1) / 4);
}

interface FactorState {
  grado: number;
  justificacion: string;
}

interface AIAnalysis {
  [key: string]: FactorState;
}

type PageState = 'select' | 'evaluating' | 'result' | 'saving' | 'saved' | 'error';

const WizardEvaluacion: React.FC = () => {
  const [puestos, setPuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPuestoId, setSelectedPuestoId] = useState('');
  const [puestoDetails, setPuestoDetails] = useState<any>(null);
  const [pageState, setPageState] = useState<PageState>('select');
  const [aiError, setAiError] = useState<string | null>(null);
  const [savedEvaluacionId, setSavedEvaluacionId] = useState<string | null>(null);
  const [totalPuntos, setTotalPuntos] = useState(0);
  const [factorPoints, setFactorPoints] = useState<Record<string, number>>({});
  const [editingFactor, setEditingFactor] = useState<string | null>(null);

  const [analisis, setAnalisis] = useState<AIAnalysis>({});
  const [procedimientosCount, setProcedimientosCount] = useState(0);
  const [procContribution, setProcContribution] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const puestoIdParam = params.get('puesto_id');
    api.get('/puestos').then(res => {
      const available = Array.isArray(res.data) ? res.data.filter((p: any) => p.estado !== 'aprobado') : [];
      setPuestos(available);
      setLoading(false);
      if (puestoIdParam) {
        handlePuestoSelect(puestoIdParam);
      }
    });
  }, []);

  const handlePuestoSelect = useCallback(async (id: string) => {
    setSelectedPuestoId(id);
    setAnalisis({});
    setFactorPoints({});
    setTotalPuntos(0);
    setProcedimientosCount(0);
    setProcContribution([]);
    setPageState('select');
    setAiError(null);
    setSavedEvaluacionId(null);
    setEditingFactor(null);
    if (!id) {
      setPuestoDetails(null);
      return;
    }
    try {
      const res = await api.get(`/puestos/${id}`);
      setPuestoDetails(res.data);
    } catch (e) {
      console.error('Error fetching puesto:', e);
    }
  }, []);

  const handleEvaluate = async () => {
    if (!selectedPuestoId) return;
    setPageState('evaluating');
    setAiError(null);
    try {
      const res = await api.post('/evaluaciones/ai-evaluate', { puesto_id: selectedPuestoId }, { timeout: 120000 });
      const { analisis: data } = res.data;
      const newAnalisis: AIAnalysis = {};
      const factorKeys = ['dificultad', 'supervision', 'responsabilidad', 'condiciones', 'error', 'requisitos'];
      const justMap: Record<string, string> = {
        dificultad: 'dificultad_just',
        supervision: 'supervision_just',
        responsabilidad: 'responsabilidad_just',
        condiciones: 'condiciones_just',
        error: 'error_just',
        requisitos: 'requisitos_just'
      };
      for (const key of factorKeys) {
        newAnalisis[key] = {
          grado: data[key] || 1,
          justificacion: data[justMap[key]] || ''
        };
      }
      setAnalisis(newAnalisis);
      setSavedEvaluacionId(res.data.evaluacion.id);
      setTotalPuntos(res.data.totalPuntos || 0);
      setFactorPoints(res.data.factorPoints || {});
      setProcedimientosCount(res.data.procedimientosCount || 0);
      setProcContribution(res.data.procContribution || []);
      setPageState('result');
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Error al comunicarse con el agente IA';
      setAiError(msg);
      setPageState('error');
    }
  };

  const handleSave = async () => {
    if (!savedEvaluacionId) return;
    setPageState('saving');
    try {
      const payload: any = { estado: 'aprobada' };
      for (const factor of FACTORS_CONFIG) {
        const a = analisis[factor.key];
        if (!a) continue;
        const key = factor.key;
        payload[key] = a.grado;
        const justMap: Record<string, string> = {
          dificultad: 'difficulty_just',
          supervision: 'supervision_just',
          responsabilidad: 'resp_just',
          condiciones: 'condiciones_just',
          error: 'error_just',
          requisitos: 'requisitos_just'
        };
        payload[justMap[key]] = a.justificacion;
      }
      await api.put(`/evaluaciones/${savedEvaluacionId}`, payload);
      setPageState('saved');
    } catch (error: any) {
      setAiError(error.response?.data?.error || 'Error al guardar la evaluación');
      setPageState('result');
    }
  };

  const handleDownloadReport = () => {
    if (!savedEvaluacionId) return;
    window.open(`/api/evaluaciones/${savedEvaluacionId}/report`, '_blank');
  };

  const handleReset = () => {
    setAnalisis({});
    setFactorPoints({});
    setTotalPuntos(0);
    setProcedimientosCount(0);
    setProcContribution([]);
    setPageState('select');
    setAiError(null);
    setSavedEvaluacionId(null);
    setEditingFactor(null);
  };

  const handleGradeChange = (factorKey: string, grado: number) => {
    const factor = FACTORS_CONFIG.find(f => f.key === factorKey);
    if (!factor) return;

    const base: Record<string, number> = { ...factorPoints };
    if (Object.keys(base).length === 0) {
      for (const f of FACTORS_CONFIG) {
        const a = analisis[f.key];
        if (a) base[f.key] = linearPts(a.grado, f.maxPts);
      }
    }
    base[factorKey] = linearPts(grado, factor.maxPts);
    setFactorPoints(base);
    setTotalPuntos(Object.values(base).reduce((s, v) => s + v, 0));

    setAnalisis(prev => ({
      ...prev,
      [factorKey]: { ...prev[factorKey], grado }
    }));
  };

  const totalMax = FACTORS_CONFIG.reduce((sum, f) => sum + f.points[5], 0);
  const porcentaje = totalMax > 0 ? Math.round((totalPuntos / totalMax) * 100) : 0;
  const estrato = useMemo<EstratoResult | null>(() => getEstratoCompleto(totalPuntos), [totalPuntos]);

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-muted-foreground font-medium">Cargando catálogo de puestos...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Valoración por Agente IA</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análisis objetivo automatizado — Metodología MSC Puntos por Factores</p>
        </div>
        <div className="bg-primary/5 px-5 py-3 rounded-2xl border border-primary/10 text-right min-w-[140px]">
          <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Puntaje Total</p>
          <p className={`text-3xl font-black leading-none transition-colors ${pageState === 'result' || pageState === 'saved' ? 'text-primary' : 'text-muted-foreground'}`}>
            {pageState === 'select' || pageState === 'evaluating' ? '—' : `${totalPuntos}`}
            <span className="text-sm font-medium text-muted-foreground">/{totalMax}</span>
          </p>
          {estrato && (
            <p className="text-[11px] font-bold text-muted-foreground mt-1 leading-tight">{estrato.clase.nombre}</p>
          )}
        </div>
      </div>

      {aiError && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 text-sm text-destructive">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{aiError}</span>
          <button onClick={() => setAiError(null)} className="ml-auto text-destructive/60 hover:text-destructive">&times;</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-5">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seleccionar Puesto a Evaluar</label>
            <div className="flex gap-3">
              <select
                className="flex-1 p-3 bg-muted/50 border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={selectedPuestoId}
                onChange={e => handlePuestoSelect(e.target.value)}
              >
                <option value="">— Seleccionar puesto —</option>
                {puestos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.area})</option>
                ))}
              </select>
              <button
                onClick={handleEvaluate}
                disabled={!selectedPuestoId || pageState === 'evaluating'}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
              >
                {pageState === 'evaluating' ? (
                  <><Loader2 size={18} className="animate-spin" /> Analizando...</>
                ) : (
                  <><Sparkles size={18} /> Evaluar con IA</>
                )}
              </button>
            </div>
            {pageState === 'evaluating' && (
              <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-primary" />
                El agente IA está analizando la descripción de funciones contra la rúbrica MSC...
              </div>
            )}
          </div>

          {pageState === 'result' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  Resultado del Análisis Automático
                </h3>
                <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <RotateCcw size={13} /> Nueva evaluación
                </button>
              </div>

              {FACTORS_CONFIG.map((factor, idx) => {
                const a = analisis[factor.key];
                if (!a) return null;
                const isEditing = editingFactor === factor.key;
                const Icon = factor.icon;

                return (
                  <div key={factor.key} className="bg-card border rounded-xl overflow-hidden transition-all">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.grado >= 4 ? 'bg-green-100 text-green-700' : a.grado >= 3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">Factor {idx + 1}: {factor.label}</h4>
                            <p className="text-[10px] text-muted-foreground">{factor.desc}</p>
                            {procContribution.includes(factor.key) && (
                              <span className="inline-flex items-center gap-0.5 mt-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded leading-tight">
                                <FileText size={10} /> Proc
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-foreground">{(factorPoints[factor.key] ?? factor.points[a.grado])} <span className="text-xs font-medium text-muted-foreground">pts</span></p>
                          {isEditing ? (
                            <button onClick={() => setEditingFactor(null)} className="text-[10px] text-primary font-bold hover:underline">Cerrar</button>
                          ) : (
                            <button onClick={() => setEditingFactor(factor.key)} className="text-[10px] text-muted-foreground font-bold hover:text-foreground hover:underline">Ajustar</button>
                          )}
                        </div>
                      </div>

                      {a.justificacion && !isEditing && (
                        <div className="bg-indigo-50/70 border border-indigo-100/70 rounded-lg px-3 py-2 text-xs text-indigo-800 leading-relaxed mb-2">
                          <span className="font-semibold">Análisis IA:</span> {a.justificacion}
                        </div>
                      )}

                      {isEditing && (
                        <div className="space-y-3 pt-2">
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(g => (
                              <button
                                key={g}
                                onClick={() => handleGradeChange(factor.key, g)}
                                className={`flex-1 py-2.5 rounded-lg text-center text-xs font-bold border-2 transition-all cursor-pointer ${
                                  a.grado === g
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-slate-200 text-muted-foreground hover:border-slate-300'
                                }`}
                              >
                                <div>G{g}</div>
                                <div className="text-[10px] font-normal">{linearPts(g, factor.maxPts)} pts</div>
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground italic">{factor.grades[a.grado]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Puntuación Total</p>
                  <p className="text-2xl font-black text-primary">{totalPuntos} <span className="text-sm font-medium text-muted-foreground">/ {totalMax} pts ({porcentaje}%)</span></p>
                </div>
                {estrato && (
                  <div className={`inline-flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold ${estrato.clase.color}`}>
                    {estrato.esProhibida && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">PROHIB.</span>
                    )}
                    <span>{estrato.clase.nombre}</span>
                    <span className="text-muted-foreground font-medium">·</span>
                    <span>{estrato.clase.serie}</span>
                    {estrato.alternativaNoProhibida && (
                      <>
                        <span className="text-muted-foreground font-medium mx-0.5">→</span>
                        <span className="text-muted-foreground">{estrato.alternativaNoProhibida.nombre}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {procedimientosCount > 0 && (
                <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl px-4 py-3 flex items-start gap-3 text-xs text-indigo-800">
                  <FileText size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>
                    Evaluación basada en las funciones oficiales y <strong>{procedimientosCount} procedimiento{procedimientosCount !== 1 ? 's' : ''} operativo{procedimientosCount !== 1 ? 's' : ''}</strong> asociados al área del puesto.
                    {procContribution.length > 0 ? (
                      <> Los procedimientos aportaron evidencia adicional en los factores: <strong>{procContribution.map(k => FACTORS_CONFIG.find(f => f.key === k)?.label || k).join(', ')}</strong>.</>
                    ) : (
                      <> No se encontraron indicadores adicionales en los procedimientos para modificar la asignación.</>
                    )}
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200"
                >
                  <Save size={16} /> Guardar Evaluación
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={!savedEvaluacionId}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                >
                  <Download size={16} /> Descargar Informe PDF
                </button>
              </div>
            </div>
          )}

          {pageState === 'saved' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800">Evaluación Guardada Exitosamente</h3>
                <p className="text-sm text-green-600 mt-1">La evaluación del agente IA ha sido registrada en el sistema.</p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={handleDownloadReport} className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 shadow-lg">
                  <Download size={16} /> Descargar Informe PDF
                </button>
                <button onClick={handleReset} className="px-6 py-2.5 border rounded-xl font-bold text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <RotateCcw size={16} /> Nueva Evaluación
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:w-80 space-y-4">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b pb-3">
              <Info size={16} className="text-primary" /> Información del Puesto
            </h3>
            {puestoDetails ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Nombre</p>
                  <p className="font-semibold text-foreground">{puestoDetails.nombre}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Área</p>
                  <p className="text-foreground">{puestoDetails.area}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Funciones</p>
                  <p className="text-xs text-muted-foreground leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">{puestoDetails.descripcion_funciones}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Requisitos</p>
                  <p className="text-xs text-muted-foreground">{puestoDetails.educacion_requerida || '—'}</p>
                  <p className="text-xs text-muted-foreground">{puestoDetails.experiencia_requerida || '—'}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">Seleccione un puesto para ver sus detalles.</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-indigo-500" /> Agente Evaluador IA
            </h3>
            <p className="text-xs text-indigo-700/80 leading-relaxed">
              El agente analiza objetivamente la descripción de funciones contra la rúbrica MSC y asigna grados del 1 al 5 para cada factor, eliminando la subjetividad humana en el proceso de valoración.
            </p>
            {pageState === 'result' && (
              <div className="mt-3 bg-white/70 rounded-lg p-3 border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-800 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-600" /> Evaluación completada
                </p>
                <p className="text-[10px] text-indigo-600 mt-1">
                  {totalPuntos} puntos asignados. Revise el desglose por factor en el panel principal.
                </p>
                {estrato && (
                  <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded border ${estrato.clase.color}`}>
                    {estrato.clase.nombre}
                    {estrato.esProhibida && estrato.alternativaNoProhibida && (
                      <span className="text-muted-foreground font-normal ml-1">
                        → {estrato.alternativaNoProhibida.nombre}
                      </span>
                    )}
                  </div>
                )}
                {procedimientosCount > 0 && (
                  <div className="mt-2 text-[10px] text-indigo-600 flex items-center gap-1.5 bg-indigo-50/50 px-2 py-1.5 rounded border border-indigo-100">
                    <FileText size={11} />
                    <span>{procedimientosCount} procedimiento{procedimientosCount !== 1 ? 's' : ''} operativo{procedimientosCount !== 1 ? 's' : ''} asociado{procedimientosCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
            <ShieldAlert size={18} className="text-amber-600 shrink-0" />
            <p className="text-[10px] text-amber-800 leading-tight">
              La evaluación es generada automáticamente por IA basándose en la descripción de funciones. Los resultados deben ser revisados por el departamento de RRHH antes de su aplicación definitiva.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default WizardEvaluacion;
