import React, { useState, useEffect } from 'react';
import { Calculator, Target, ArrowRight, Save, Info, AlertCircle } from 'lucide-react';
import api from '../services/api';

const CalculoVP: React.FC = () => {
    const [vpData, setVpData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [manualVP, setManualVP] = useState('');

    useEffect(() => {
        fetchVP();
    }, []);

    const fetchVP = async () => {
        try {
            const res = await api.get('/calculos/vp');
            setVpData(res.data);
            setManualVP(res.data?.vpExact?.toString() || '');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatColones = (amount: number) => {
        return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Determinación del Valor del Punto</h1>
                <p className="text-muted-foreground">Cálculo técnico para transformar puntos de evaluación en salarios competitivos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sugerencia Técnica */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card border rounded-2xl p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
                        
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase mb-6">
                            <Target size={16} /> Sugerencia Técnica Basada en Mercado
                        </div>

                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-10 bg-slate-100 rounded w-1/3"></div>
                                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="text-5xl font-black text-foreground">
                                    {formatColones(vpData?.vpExact || 0)}
                                    <span className="text-sm font-normal text-muted-foreground ml-2">por punto</span>
                                </div>
                                <p className="text-sm text-muted-foreground max-w-md mt-4">
                                    Este valor se ha determinado promediando {vpData?.puestosReferencia || 0} puestos clave evaluados contra el estándar de Salario Global de MIDEPLAN.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4">
                        <Info className="text-blue-600 shrink-0" size={20} />
                        <div className="text-xs text-blue-800 leading-relaxed">
                            <p className="font-bold mb-1">Nota Técnica:</p>
                            El Valor del Punto (VP) es la constante matemática que, multiplicada por el total de puntos de un cargo, define su salario base. Un VP de {formatColones(vpData?.vpExact || 0)} garantiza alineación con el mercado municipal de gran escala.
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="space-y-6">
                    <div className="bg-card border rounded-2xl p-6 shadow-sm">
                        <h3 className="font-semibold text-sm mb-4">Aprobar Valor del Punto</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Valor Final Aplicado</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-background border rounded-lg px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={manualVP}
                                    onChange={(e) => setManualVP(e.target.value)}
                                />
                            </div>
                            <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all">
                                <Save size={18} /> Publicar Escala
                            </button>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-slate-300 flex items-center gap-3">
                        <AlertCircle className="text-muted-foreground" size={16} />
                        <p className="text-[10px] text-muted-foreground italic">Requiere aprobación del Concejo Municipal según normativa vigente.</p>
                    </div>
                </div>
            </div>

            {/* Pasos de Validación */}
            <div className="bg-slate-50 border rounded-xl p-6">
                <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-500">Variables de Cálculo</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg border shadow-sm flex items-center justify-center font-bold text-slate-400">∑P</div>
                        <div>
                            <p className="text-xs font-bold text-slate-600">Suma Puntos Clave</p>
                            <p className="text-lg font-black text-slate-900">{vpData?.totalPuntos || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg border shadow-sm flex items-center justify-center font-bold text-slate-400">₡S</div>
                        <div>
                            <p className="text-xs font-bold text-slate-600">Masa Salarial Mercado</p>
                            <p className="text-lg font-black text-slate-900">{formatColones(vpData?.totalSalarios || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculoVP;
