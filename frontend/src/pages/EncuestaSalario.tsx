import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Landmark, ShieldCheck, Info, Play, RefreshCw, CheckCircle, FileSearch, AlertCircle } from 'lucide-react';
import api from '../services/api';

const EncuestaSalario: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningId, setRunningId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/encuestas');
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const ejecutarEstudio = async (puesto: any) => {
        setRunningId(puesto.id);
        try {
            const resScraping = await api.get(`/encuestas/scraping?puesto=${puesto.puesto_nombre}&id=${puesto.id}`);
            const { salario_minimo, salario_promedio, salario_maximo, fuente } = resScraping.data.data;

            await api.post('/encuestas', {
                puesto_id: puesto.id,
                salario_minimo,
                salario_promedio,
                salario_maximo,
                fuente
            });

            await fetchData();
        } catch (error) {
            alert('Error al ejecutar el motor de salarios');
        } finally {
            setRunningId(null);
        }
    };

    const formatColones = (amount: number | null) => {
        if (amount === null) return '---';
        return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);
    };

    const getConfianzaBadge = (nivel: string) => {
        if (!nivel) return null;
        const isHigh = nivel.includes('ALTA');
        return (
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${isHigh ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                {nivel}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <BarChart3 size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Metodología de Mercado</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Sondeo de Salario Global</h1>
                    <p className="text-muted-foreground mt-1">Comparativo técnico de Puestos Clave (Benchmarks) — Alineado a Manual 2022</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                        <ShieldCheck className="text-blue-600" size={24} />
                        <div>
                            <p className="text-[10px] uppercase font-bold text-blue-600">Ajuste Munis Tipo A</p>
                            <p className="text-xs text-blue-800 font-bold">San Carlos (1.08x)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-card border rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-primary">
                            <Info size={16} /> Auditoría del Dato
                        </h3>
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Referencia Base</p>
                                <p className="text-xs font-bold text-slate-700">Ley 10.159 (Empleo Público)</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Criterio Institucional</p>
                                <p className="text-xs font-bold text-slate-700 italic">P-DRH-035-2022 (Actualizado)</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Landmark size={80} />
                        </div>
                        <TrendingUp className="text-primary mb-3 relative z-10" size={20} />
                        <p className="text-[10px] uppercase font-bold text-slate-400 relative z-10">Trazabilidad Técnica</p>
                        <p className="text-xs leading-relaxed text-slate-300 mt-2 relative z-10">
                            Cada monto es validado contra el estrato oficial de la Municipalidad para asegurar equidad interna.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileSearch size={16} className="text-primary" />
                                <h3 className="font-bold text-sm uppercase tracking-tight">Estudio de Mercado Institucional</h3>
                            </div>
                            <button onClick={fetchData} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Puesto Clave</th>
                                        <th className="px-6 py-4 text-center">Clasificación / Pts</th>
                                        <th className="px-6 py-4">Fiabilidad</th>
                                        <th className="px-6 py-4 text-right">Salario Mercado</th>
                                        <th className="px-6 py-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(Array.isArray(data) ? data : []).map((puesto) => (
                                        <tr key={puesto.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-foreground group-hover:text-primary transition-colors">{puesto.puesto_nombre}</div>
                                                <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                                    <Landmark size={10} /> {puesto.fuente}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-700">{puesto.clase_oficial}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">{puesto.puntos} puntos evaluados</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {puesto.salario_promedio ? (
                                                    <div className="space-y-1">
                                                        {getConfianzaBadge(puesto.confianza)}
                                                        <div className="text-[9px] text-slate-400 block font-medium">{puesto.referencia_manual}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 italic text-[10px]">Pendiente de sondeo</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {puesto.salario_promedio ? (
                                                    <div className="font-black text-foreground text-base tracking-tight">{formatColones(puesto.salario_promedio)}</div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1 text-amber-500 font-bold text-[10px] uppercase">
                                                        <AlertCircle size={12} /> Requiere Sondeo
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {puesto.salario_promedio ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Validado</span>
                                                        <CheckCircle className="text-green-500" size={18} />
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => ejecutarEstudio(puesto)}
                                                        disabled={runningId === puesto.id}
                                                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 ml-auto hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                                                    >
                                                        {runningId === puesto.id ? 'ANALIZANDO...' : <><Play size={10} fill="currentColor" /> EJECUTAR SONDEO</>}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EncuestaSalario;
