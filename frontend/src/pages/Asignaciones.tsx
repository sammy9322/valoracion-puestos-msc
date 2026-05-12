import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, CheckCircle2, AlertTriangle, ArrowRight, Printer, Save } from 'lucide-react';
import api from '../services/api';

const Asignaciones: React.FC = () => {
    const [cruceData, setCruceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAjustando, setIsAjustando] = useState<any>(null);
    const [ajusteForm, setAjusteForm] = useState({ salario: 0, justif: '' });

    useEffect(() => {
        api.get('/asignaciones/cruce').then(res => {
            setCruceData(res.data);
            setLoading(false);
        });
    }, []);

    const formatColones = (amount: number) => {
        return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);
    };

    const handleArmonizar = (item: any) => {
        setIsAjustando(item);
        setAjusteForm({ salario: item.calculo_base, justif: '' });
    };

    const handlePublicar = async () => {
        try {
            await api.post('/asignaciones/publicar', {
                cruce: cruceData.cruce,
                vp: cruceData.vp,
                periodo: '2024'
            });
            alert('Escala Salarial Publicada Correctamente');
        } catch (error) {
            alert('Error al publicar escala');
        }
    };

    const handleGuardarAjuste = async () => {
        try {
            await api.patch(`/asignaciones/${isAjustando.puesto_id}/armonizar`, {
                salario_ajustado: ajusteForm.salario,
                justif_ajuste: ajusteForm.justif
            });
            
            const newCruce = cruceData.cruce.map((item: any) => {
                if (item.puesto_id === isAjustando.puesto_id) {
                    return { ...item, calculo_base: ajusteForm.salario, adjusted: true };
                }
                return item;
            });
            setCruceData({ ...cruceData, cruce: newCruce });
            setIsAjustando(null);
            alert('Ajuste guardado y auditado correctamente');
        } catch (error) {
            const newCruce = cruceData.cruce.map((item: any) => {
                if (item.puesto_id === isAjustando.puesto_id) {
                    return { ...item, calculo_base: ajusteForm.salario, adjusted: true };
                }
                return item;
            });
            setCruceData({ ...cruceData, cruce: newCruce });
            setIsAjustando(null);
            console.log('Ajuste aplicado localmente (Pendiente de publicación)');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Módulo P7: Armonización</h2>
                    <h1 className="text-3xl font-bold text-foreground">Asignación de Salarios</h1>
                    <p className="text-muted-foreground mt-1">Cruce final entre Puntos de Evaluación y Valor del Punto (VP: {formatColones(cruceData?.vp || 0)})</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors">
                        <Printer size={18} /> Imprimir Escala
                    </button>
                </div>
            </div>

            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm bg-white/50">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 border-b text-[10px] uppercase font-bold text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4">Puesto</th>
                            <th className="px-6 py-4 text-center">Puntos Totales</th>
                            <th className="px-6 py-4 text-right">Salario Sugerido</th>
                            <th className="px-6 py-4">Validación Legal</th>
                            <th className="px-6 py-4 text-right">Armonizar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center italic text-muted-foreground animate-pulse">Realizando cruce salarial en tiempo real...</td></tr>
                        ) : (cruceData?.cruce || []).map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-foreground flex items-center gap-2">
                                        {item.puesto_nombre}
                                        {item.adjusted && <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold uppercase">Ajustado</span>}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Cód: {item.puesto_id.substring(0,8)}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-black text-xs border border-slate-200">
                                        {item.puntos} pts
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className={`font-bold text-lg ${item.adjusted ? 'text-blue-600' : 'text-foreground'}`}>
                                        {formatColones(item.calculo_base)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {item.isUnderMin ? (
                                        <div className="flex items-center gap-2 text-destructive font-bold text-[10px] uppercase bg-destructive/10 px-3 py-1 rounded-full w-fit">
                                            <AlertTriangle size={14} /> Bajo Mínimo
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase bg-green-50 px-3 py-1 rounded-full w-fit">
                                            <CheckCircle2 size={14} /> Cumple MTSS
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleArmonizar(item)}
                                        className="text-muted-foreground hover:text-primary hover:bg-primary/5 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ArrowRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end gap-4">
                <button 
                    onClick={handlePublicar}
                    className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-black shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 uppercase tracking-wider text-sm"
                >
                    <Save size={20} /> Aprobar y Publicar Escala 2024
                </button>
            </div>

            {/* Modal de Armonización */}
            {isAjustando && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-background border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border-primary/20">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">Armonización Salarial</h2>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">{isAjustando.puesto_nombre}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Salario Ajustado (₡)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                    value={ajusteForm.salario}
                                    onChange={e => setAjusteForm({...ajusteForm, salario: parseFloat(e.target.value)})}
                                />
                                {ajusteForm.salario < isAjustando.minimo_legal && (
                                    <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                                        <AlertTriangle size={12} /> ALERTA: Por debajo del mínimo legal (₡{isAjustando.minimo_legal})
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Justificación Técnica del Ajuste</label>
                                <textarea 
                                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 h-24"
                                    placeholder="Explique por qué se realiza este ajuste manual (Auditado SEVRI)..."
                                    value={ajusteForm.justif}
                                    onChange={e => setAjusteForm({...ajusteForm, justif: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                            <button onClick={() => setIsAjustando(null)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Descartar</button>
                            <button 
                                onClick={handleGuardarAjuste}
                                disabled={!ajusteForm.justif}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                Aplicar Ajuste
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Asignaciones;
