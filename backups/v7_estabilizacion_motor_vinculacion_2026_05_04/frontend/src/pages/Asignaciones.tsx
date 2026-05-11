import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, CheckCircle2, AlertTriangle, ArrowRight, Printer, Save } from 'lucide-react';
import api from '../services/api';

const Asignaciones: React.FC = () => {
    const [cruceData, setCruceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/asignaciones/cruce').then(res => {
            setCruceData(res.data);
            setLoading(false);
        });
    }, []);

    const formatColones = (amount: number) => {
        return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Asignación de Salarios</h1>
                    <p className="text-muted-foreground mt-1">Cruce final entre Puntos de Evaluación y Valor del Punto (VP: {formatColones(cruceData?.vp || 0)})</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors">
                    <Printer size={18} /> Imprimir Escala
                </button>
            </div>

            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4">Puesto</th>
                            <th className="px-6 py-4 text-center">Puntos Totales</th>
                            <th className="px-6 py-4 text-right">Salario Base Sugerido</th>
                            <th className="px-6 py-4">Validación</th>
                            <th className="px-6 py-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center italic text-muted-foreground">Realizando cruce salarial...</td></tr>
                        ) : cruceData?.cruce.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-foreground">{item.puesto_nombre}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Cód: {item.puesto_id.substring(0,8)}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-black text-xs border border-blue-100">
                                        {item.puntos}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="font-bold text-foreground text-lg">{formatColones(item.calculo_base)}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {item.isUnderMin ? (
                                        <div className="flex items-center gap-2 text-destructive font-bold text-[10px] uppercase">
                                            <AlertTriangle size={14} /> Bajo Mínimo Legal
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase">
                                            <CheckCircle2 size={14} /> Cumple Estándar
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-primary hover:bg-primary/5 p-2 rounded-lg transition-colors">
                                        <ArrowRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end gap-4">
                <button className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-black shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 uppercase tracking-wider text-sm">
                    <Save size={20} /> Aprobar Escala Salarial 2024
                </button>
            </div>
        </div>
    );
};

export default Asignaciones;
