import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Save, Info, CheckCircle2, ShieldAlert, Thermometer, GraduationCap, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const WizardEvaluacion: React.FC = () => {
    const [puestos, setPuestos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    
    const [evaluacion, setEvaluacion] = useState({
        puesto_id: '',
        dificultad: 1, difficulty_just: '',
        supervision: 1, supervision_just: '',
        responsabilidad: 1, resp_just: '',
        condiciones: 1, condiciones_just: '',
        error: 1, error_just: '',
        requisitos: 1, requisitos_just: ''
    });

    // Puntos por grado (Estimación técnica para San Carlos)
    const pointsMap: any = {
        dificultad: [0, 40, 80, 120, 160, 200],
        supervision: [0, 30, 60, 90, 120, 150],
        responsabilidad: [0, 40, 80, 120, 160, 200],
        condiciones: [0, 20, 40, 60, 80, 100],
        error: [0, 30, 60, 90, 120, 150],
        requisitos: [0, 40, 80, 120, 160, 200]
    };

    useEffect(() => {
        api.get('/puestos').then(res => {
            setPuestos(res.data.filter((p: any) => p.estado !== 'aprobado'));
            setLoading(false);
        });
    }, []);

    const totalPuntos = 
        pointsMap.dificultad[evaluacion.dificultad] +
        pointsMap.supervision[evaluacion.supervision] +
        pointsMap.responsabilidad[evaluacion.responsabilidad] +
        pointsMap.condiciones[evaluacion.condiciones] +
        pointsMap.error[evaluacion.error] +
        pointsMap.requisitos[evaluacion.requisitos];

    const handleSave = async () => {
        try {
            await api.post('/evaluaciones', {
                ...evaluacion,
                puntos_totales: totalPuntos
            });
            alert('Evaluación guardada con éxito');
            window.location.href = '/';
        } catch (error) {
            alert('Error al guardar la evaluación');
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Cargando catálogo...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Asistente de Valoración</h1>
                    <p className="text-muted-foreground mt-1">Metodología de Puntos por Factores — San Carlos</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Puntaje Acumulado</p>
                    <p className="text-4xl font-black text-primary leading-none">{totalPuntos}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map(s => (
                    <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary' : 'bg-slate-200'}`} />
                ))}
            </div>

            <div className="bg-card border rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-8 flex-1">
                    {/* Step 1: Puesto */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <CheckCircle2 size={24} />
                                <h2 className="text-xl font-bold">Selección del Cargo</h2>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 uppercase">Seleccione el puesto a evaluar</label>
                                <select 
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-medium outline-none focus:border-primary transition-colors"
                                    value={evaluacion.puesto_id}
                                    onChange={(e) => setEvaluacion({...evaluacion, puesto_id: e.target.value})}
                                >
                                    <option value="">Seleccionar...</option>
                                    {puestos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.area})</option>)}
                                </select>
                            </div>
                            
                            <div className="space-y-4 pt-6 border-t">
                                <h3 className="font-bold flex items-center gap-2"><Info size={18} /> Factor 1: Dificultad de Funciones</h3>
                                <p className="text-sm text-muted-foreground italic">Complejidad de las tareas, iniciativa y juicio requerido.</p>
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map(g => (
                                        <button 
                                            key={g}
                                            onClick={() => setEvaluacion({...evaluacion, dificultad: g})}
                                            className={`p-4 rounded-xl border-2 transition-all ${evaluacion.dificultad === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.dificultad[g]} pts</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Supervisión */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <CheckCircle2 size={24} />
                                <h2 className="text-xl font-bold">Supervisión y Responsabilidad</h2>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-slate-700">Factor 2: Supervisión Ejercida</h3>
                                <p className="text-sm text-muted-foreground">Cantidad y nivel de personal bajo su cargo directo o indirecto.</p>
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map(g => (
                                        <button 
                                            key={g}
                                            onClick={() => setEvaluacion({...evaluacion, supervision: g})}
                                            className={`p-4 rounded-xl border-2 transition-all ${evaluacion.supervision === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.supervision[g]} pts</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t">
                                <h3 className="font-bold flex items-center gap-2 text-slate-700">Factor 3: Responsabilidad</h3>
                                <p className="text-sm text-muted-foreground">Responsabilidad por valores, equipo, materiales o información confidencial.</p>
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map(g => (
                                        <button 
                                            key={g}
                                            onClick={() => setEvaluacion({...evaluacion, responsabilidad: g})}
                                            className={`p-4 rounded-xl border-2 transition-all ${evaluacion.responsabilidad === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.responsabilidad[g]} pts</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Condiciones de Trabajo */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <Thermometer size={24} />
                                <h2 className="text-xl font-bold">Condiciones de Trabajo</h2>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-slate-700">Factor 4: Ambiente y Esfuerzo</h3>
                                <p className="text-sm text-muted-foreground italic">Exposición a riesgos, esfuerzo físico y condiciones ambientales (calor, ruido, etc).</p>
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map(g => (
                                        <button 
                                            key={g}
                                            onClick={() => setEvaluacion({...evaluacion, condiciones: g})}
                                            className={`p-4 rounded-xl border-2 transition-all ${evaluacion.condiciones === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.condiciones[g]} pts</div>
                                        </button>
                                    ))}
                                </div>
                                <textarea 
                                    className="w-full p-4 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Justifique las condiciones de riesgo o esfuerzo..."
                                    value={evaluacion.condiciones_just}
                                    onChange={e => setEvaluacion({...evaluacion, condiciones_just: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Consecuencia del Error */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <AlertTriangle size={24} />
                                <h2 className="text-xl font-bold">Impacto Institucional</h2>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-slate-700">Factor 5: Consecuencia del Error</h3>
                                <p className="text-sm text-muted-foreground italic">Gravedad del daño institucional si ocurre un error en el puesto.</p>
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map(g => (
                                        <button 
                                            key={g}
                                            onClick={() => setEvaluacion({...evaluacion, error: g})}
                                            className={`p-4 rounded-xl border-2 transition-all ${evaluacion.error === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.error[g]} pts</div>
                                        </button>
                                    ))}
                                </div>
                                <textarea 
                                    className="w-full p-4 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Describa el impacto potencial de un error en este cargo..."
                                    value={evaluacion.error_just}
                                    onChange={e => setEvaluacion({...evaluacion, error_just: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 5: Requisitos */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <GraduationCap size={24} />
                                <h2 className="text-xl font-bold">Perfil del Puesto</h2>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-slate-700">Factor 6: Requisitos (Educación y Experiencia)</h3>
                                <p className="text-sm text-muted-foreground italic">Nivel académico formal y años de experiencia mínima requerida.</p>
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map(g => (
                                        <button 
                                            key={g}
                                            onClick={() => setEvaluacion({...evaluacion, requisitos: g})}
                                            className={`p-4 rounded-xl border-2 transition-all ${evaluacion.requisitos === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.requisitos[g]} pts</div>
                                        </button>
                                    ))}
                                </div>
                                <textarea 
                                    className="w-full p-4 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Especifique los títulos y experiencia necesaria..."
                                    value={evaluacion.requisitos_just}
                                    onChange={e => setEvaluacion({...evaluacion, requisitos_just: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 6: Finalización */}
                    {step === 6 && (
                        <div className="py-10 text-center space-y-6 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                                <Save size={40} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">Evaluación Completada</h2>
                                <p className="text-muted-foreground">El puesto ha sido calificado con un total de **{totalPuntos} puntos**.</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border max-w-sm mx-auto">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Clasificación Estimada</p>
                                <p className="text-xl font-black text-primary">Listo para Aprobación</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-slate-50/50 flex justify-between items-center">
                    <button 
                        disabled={step === 1}
                        onClick={() => setStep(step - 1)}
                        className="px-6 py-2 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all"
                    >
                        <ChevronLeft size={18} /> Anterior
                    </button>
                    
                    {step < 6 ? (
                        <button 
                            disabled={step === 1 && !evaluacion.puesto_id}
                            onClick={() => setStep(step + 1)}
                            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                        >
                            Siguiente Paso <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button 
                            onClick={handleSave}
                            className="bg-green-600 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-200 hover:bg-green-700 transition-all"
                        >
                            Finalizar y Guardar <CheckCircle2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
                <ShieldAlert className="text-amber-600 shrink-0" size={24} />
                <p className="text-xs text-amber-800 leading-relaxed">
                    **Recordatorio Legal:** Toda evaluación de puesto debe estar debidamente justificada en el Manual de Clases de la Municipalidad de San Carlos para evitar impugnaciones ante el Servicio Civil.
                </p>
            </div>
        </div>
    );
};

export default WizardEvaluacion;
