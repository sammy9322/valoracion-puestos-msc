import React, { useState, useEffect } from 'react';
import { Target, Star, ChevronRight, Info, Search, AlertCircle } from 'lucide-react';
import api from '../services/api';

const PuestosClave: React.FC = () => {
    const [puestos, setPuestos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPuestos();
    }, []);

    const fetchPuestos = async () => {
        try {
            const res = await api.get('/puestos');
            setPuestos(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleClave = async (id: string, current: boolean) => {
        try {
            await api.put(`/puestos/${id}/clave`, { es_puesto_clave: !current });
            fetchPuestos(); // Refresh
        } catch (error) {
            alert('Error al actualizar el puesto');
        }
    };

    const puestosClave = puestos.filter(p => p.es_puesto_clave);

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Target size={24} />
                        </div>
                        <h1 className="text-3xl font-bold">Gestión de Puestos Clave</h1>
                    </div>
                    <p className="max-w-2xl text-primary-foreground/90 leading-relaxed">
                        Selecciona los cargos que servirán como referencia técnica para el mercado. Un puesto clave debe tener funciones bien definidas y ser común en el sector público.
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info and Tips */}
                <div className="space-y-6">
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Info size={16} className="text-primary" /> ¿Qué es un Puesto Clave?
                        </h3>
                        <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                            <p>Son puestos que actúan como <span className="font-bold text-foreground text-blue-600 italic">"Benchmarks"</span>.</p>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 italic">
                                "Por ejemplo: Un Contador, un Abogado o un Misceláneo son puestos clave porque su salario es fácilmente comparable con otras instituciones."
                            </div>
                            <p>El sistema requiere al menos 5 puestos clave evaluados para generar una sugerencia de Valor de Punto estable.</p>
                        </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
                        <div className="flex items-center gap-2 text-orange-700 font-bold text-xs uppercase mb-3">
                            <AlertCircle size={16} /> Alerta Técnica
                        </div>
                        <p className="text-xs text-orange-800 leading-relaxed font-medium">
                            Marcar o desmarcar puestos clave afectará inmediatamente los cálculos del Valor del Punto en tiempo real.
                        </p>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-sm">Catálogo de Puestos</h3>
                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                {puestosClave.length} Seleccionados
                            </div>
                        </div>

                        <div className="divide-y max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="p-10 text-center text-muted-foreground italic">Cargando catálogo...</div>
                            ) : puestos.map((puesto) => (
                                <div 
                                    key={puesto.id} 
                                    className={`p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group ${puesto.es_puesto_clave ? 'bg-primary/5' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => toggleClave(puesto.id, puesto.es_puesto_clave)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                                                puesto.es_puesto_clave 
                                                    ? 'bg-primary border-primary text-white shadow-md' 
                                                    : 'bg-white border-slate-200 text-slate-300 hover:border-primary hover:text-primary'
                                            }`}
                                        >
                                            <Star size={20} fill={puesto.es_puesto_clave ? "currentColor" : "none"} />
                                        </button>
                                        <div>
                                            <h4 className={`font-semibold text-sm ${puesto.es_puesto_clave ? 'text-primary' : 'text-foreground'}`}>
                                                {puesto.nombre}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{puesto.area}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" size={16} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PuestosClave;
