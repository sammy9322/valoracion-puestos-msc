import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Save, Info, CheckCircle2, ShieldAlert, Thermometer, GraduationCap, AlertTriangle, Sparkles } from 'lucide-react';
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

    const [selectedPuestoDetails, setSelectedPuestoDetails] = useState<any>(null);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    const handleAiSuggestion = async () => {
        if (!selectedPuestoDetails) return alert('Seleccione un puesto primero');
        setAiLoading(true);
        try {
            const res = await api.post('/evaluaciones/suggest', selectedPuestoDetails, { timeout: 120000 });
            const suggestion = res.data;
            setEvaluacion(prev => ({
                ...prev,
                dificultad: suggestion.dificultad || 1, difficulty_just: suggestion.dificultad_just || '',
                supervision: suggestion.supervision || 1, supervision_just: suggestion.supervision_just || '',
                responsabilidad: suggestion.responsabilidad || 1, resp_just: suggestion.responsabilidad_just || '',
                condiciones: suggestion.condiciones || 1, condiciones_just: suggestion.condiciones_just || '',
                error: suggestion.error || 1, error_just: suggestion.error_just || '',
                requisitos: suggestion.requisitos || 1, requisitos_just: suggestion.requisitos_just || ''
            }));
            alert('El Agente IA ha completado su sugerencia. Por favor, revise y ajuste si es necesario.');
        } catch (error: any) {
            console.error(error);
            alert(`Error del Agente IA: ${error.response?.data?.error || error.message || 'Desconocido'}`);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const puestoIdParam = queryParams.get('puesto_id');

        api.get('/puestos').then(res => {
            const availablePuestos = Array.isArray(res.data) ? res.data.filter((p: any) => p.estado !== 'aprobado') : [];
            setPuestos(availablePuestos);
            setLoading(false);

            if (puestoIdParam) {
                handlePuestoChange(puestoIdParam);
            }
        });
    }, []);

    const handlePuestoChange = async (id: string) => {
        setEvaluacion({ ...evaluacion, puesto_id: id });
        if (!id) {
            setSelectedPuestoDetails(null);
            return;
        }
        setFetchingDetails(true);
        try {
            const res = await api.get(`/puestos/${id}`);
            setSelectedPuestoDetails(res.data);
        } catch (e) {
            console.error('Error fetching details:', e);
        } finally {
            setFetchingDetails(false);
        }
    };

    // Descripciones de grados según metodología MSC/MTSS
    const gradoDesc: any = {
        dificultad: [
            '',
            'Tareas simples y repetitivas, poca iniciativa.',
            'Tareas variadas pero estandarizadas.',
            'Requiere análisis y juicio para resolver problemas técnicos.',
            'Alta complejidad, planeación y coordinación institucional.',
            'Dirección estratégica y toma de decisiones críticas.'
        ],
        supervision: [
            '',
            'No ejerce supervisión.',
            'Supervisión ocasional de tareas simples.',
            'Supervisión de un grupo de trabajo operativo.',
            'Jefatura de una unidad o departamento.',
            'Dirección de un área técnica o administrativa mayor.'
        ],
        responsabilidad: [
            '',
            'Baja responsabilidad por valores o equipo.',
            'Responsabilidad moderada por materiales y herramientas.',
            'Custodia de información sensible o fondos fijos.',
            'Responsabilidad por presupuestos o activos de alto valor.',
            'Responsabilidad total por la gestión de un proceso clave.'
        ],
        condiciones: [
            '',
            'Ambiente de oficina normal, riesgos mínimos.',
            'Esfuerzo físico moderado o ambiente algo incómodo.',
            'Exposición a condiciones climáticas o ruido constante.',
            'Riesgo de accidentes laborales o manejo de químicos.',
            'Condiciones de alta peligrosidad o insalubridad constante.'
        ],
        error: [
            '',
            'Error fácil de detectar y corregir.',
            'Error causa retrasos menores en el flujo de trabajo.',
            'Error afecta a otros departamentos o al servicio al cliente.',
            'Error causa pérdidas económicas o legales significativas.',
            'Error compromete la estabilidad institucional o seguridad pública.'
        ],
        requisitos: [
            '',
            'Educación básica o primaria.',
            'Bachillerato en Educación Media o Técnico básico.',
            'Diplomado o Técnico superior especializado.',
            'Bachillerato Universitario o Licenciatura profesional.',
            'Grado de Maestría o especialización avanzada requerida.'
        ]
    };

    const totalPuntos = 
        pointsMap.dificultad[evaluacion.dificultad] +
        pointsMap.supervision[evaluacion.supervision] +
        pointsMap.responsabilidad[evaluacion.responsabilidad] +
        pointsMap.condiciones[evaluacion.condiciones] +
        pointsMap.error[evaluacion.error] +
        pointsMap.requisitos[evaluacion.requisitos];

    const handleSave = async () => {
        if (!evaluacion.puesto_id) return alert('Seleccione un puesto');
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
        <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Asistente de Valoración</h1>
                    <p className="text-muted-foreground mt-1">Metodología de Puntos por Factores — San Carlos</p>
                </div>
                <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 text-right">
                    <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Puntaje Acumulado</p>
                    <p className="text-4xl font-black text-primary leading-none">{totalPuntos}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map(s => (
                    <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary' : 'bg-slate-200'}`} />
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Panel de Evaluación */}
                <div className="flex-1 bg-card border rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
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
                                        onChange={(e) => handlePuestoChange(e.target.value)}
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
                                                type="button"
                                                onClick={() => setEvaluacion({...evaluacion, dificultad: g})}
                                                className={`p-4 rounded-xl border-2 transition-all group relative ${evaluacion.dificultad === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                                title={gradoDesc.dificultad[g]}
                                            >
                                                <div className="text-xs font-bold uppercase">Grado {g}</div>
                                                <div className="text-xl font-black">{pointsMap.dificultad[g]} pts</div>
                                                <div className="absolute bottom-full left-0 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none mb-2 z-50 transition-opacity">
                                                    {gradoDesc.dificultad[g]}
                                                </div>
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
                                            type="button"
                                            onClick={() => setEvaluacion({...evaluacion, supervision: g})}
                                            className={`p-4 rounded-xl border-2 transition-all group relative ${evaluacion.supervision === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                            title={gradoDesc.supervision[g]}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.supervision[g]} pts</div>
                                            <div className="absolute bottom-full left-0 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none mb-2 z-50 transition-opacity">
                                                {gradoDesc.supervision[g]}
                                            </div>
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
                                            type="button"
                                            onClick={() => setEvaluacion({...evaluacion, responsabilidad: g})}
                                            className={`p-4 rounded-xl border-2 transition-all group relative ${evaluacion.responsabilidad === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                            title={gradoDesc.responsabilidad[g]}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.responsabilidad[g]} pts</div>
                                            <div className="absolute bottom-full left-0 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none mb-2 z-50 transition-opacity">
                                                {gradoDesc.responsabilidad[g]}
                                            </div>
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
                                            type="button"
                                            onClick={() => setEvaluacion({...evaluacion, condiciones: g})}
                                            className={`p-4 rounded-xl border-2 transition-all group relative ${evaluacion.condiciones === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                            title={gradoDesc.condiciones[g]}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.condiciones[g]} pts</div>
                                            <div className="absolute bottom-full left-0 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none mb-2 z-50 transition-opacity">
                                                {gradoDesc.condiciones[g]}
                                            </div>
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
                                            type="button"
                                            onClick={() => setEvaluacion({...evaluacion, error: g})}
                                            className={`p-4 rounded-xl border-2 transition-all group relative ${evaluacion.error === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                            title={gradoDesc.error[g]}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.error[g]} pts</div>
                                            <div className="absolute bottom-full left-0 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none mb-2 z-50 transition-opacity">
                                                {gradoDesc.error[g]}
                                            </div>
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
                                            type="button"
                                            onClick={() => setEvaluacion({...evaluacion, requisitos: g})}
                                            className={`p-4 rounded-xl border-2 transition-all group relative ${evaluacion.requisitos === g ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}
                                            title={gradoDesc.requisitos[g]}
                                        >
                                            <div className="text-xs font-bold uppercase">Grado {g}</div>
                                            <div className="text-xl font-black">{pointsMap.requisitos[g]} pts</div>
                                            <div className="absolute bottom-full left-0 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none mb-2 z-50 transition-opacity">
                                                {gradoDesc.requisitos[g]}
                                            </div>
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
                                <h2 className="text-2xl font-bold text-slate-800">Evaluación Completada</h2>
                                <p className="text-muted-foreground">El puesto ha sido calificado con un total de **{totalPuntos} puntos**.</p>
                            </div>
                            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 max-w-sm mx-auto">
                                <p className="text-[10px] uppercase font-bold text-primary mb-2 tracking-widest">Estado Final</p>
                                <p className="text-xl font-black text-primary uppercase">Listo para Aplicar</p>
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

            {/* Panel Lateral de Detalles (Referencia Contextual) */}
            <aside className="lg:w-80 space-y-6">
                <div className="bg-white border rounded-2xl p-6 shadow-sm sticky top-8">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 border-b pb-4">
                        <Info size={18} className="text-primary" /> Información de Referencia
                    </h3>
                    
                    {fetchingDetails ? (
                        <div className="space-y-4">
                            <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
                            <div className="h-20 bg-slate-100 rounded animate-pulse"></div>
                            <div className="h-20 bg-slate-100 rounded animate-pulse"></div>
                        </div>
                    ) : selectedPuestoDetails ? (
                        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Nombre del Cargo</p>
                                <p className="text-sm font-bold text-slate-700">{selectedPuestoDetails.nombre}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Unidad Organizativa</p>
                                <p className="text-sm font-medium text-slate-600">{selectedPuestoDetails.area}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Funciones Clave</p>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-[10]">
                                    {selectedPuestoDetails.descripcion_funciones}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Requisitos Académicos</p>
                                <p className="text-xs text-slate-600">{selectedPuestoDetails.educacion_requerida}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Experiencia</p>
                                <p className="text-xs text-slate-600">{selectedPuestoDetails.experiencia_requerida}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <ShieldAlert className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-xs text-slate-400">Seleccione un puesto para ver los detalles del manual aquí.</p>
                        </div>
                    )}
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                        <Sparkles size={18} className="text-indigo-500" /> Agente Evaluador
                    </h3>
                    <p className="text-xs text-indigo-700/80 mb-4 leading-relaxed">
                        Deje que el modelo de IA analice las funciones y proponga los grados de evaluación según la metodología MSC.
                    </p>
                    <button 
                        onClick={handleAiSuggestion}
                        disabled={!selectedPuestoDetails || aiLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                    >
                        {aiLoading ? (
                            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Analizando...</span>
                        ) : (
                            <span className="flex items-center gap-2"><Sparkles size={16} /> Generar Sugerencia IA</span>
                        )}
                    </button>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                    <ShieldAlert className="text-amber-600 shrink-0" size={20} />
                    <p className="text-[10px] text-amber-800 leading-tight">
                        La puntuación debe ser coherente con las funciones descritas en el manual para evitar impugnaciones.
                    </p>
                </div>
            </aside>
        </div>
        </div>
    );
};

export default WizardEvaluacion;

