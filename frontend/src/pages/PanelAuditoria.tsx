import React, { useState, useEffect } from 'react';
import { ClipboardList, Shield, Filter, Search, History, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const PanelAuditoria: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/auditoria');
            setLogs(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (accion: string) => {
        const colors: any = {
            'ELIMINACION': 'bg-red-100 text-red-600',
            'CREACION': 'bg-green-100 text-green-600',
            'ACTUALIZACION': 'bg-blue-100 text-blue-600'
        };
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors[accion] || 'bg-slate-100 text-slate-600'}`}>{accion}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Registro de Auditoría</h1>
                        <p className="text-sm text-muted-foreground">Trazabilidad total según controles internos de la Municipalidad</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 border rounded-lg hover:bg-slate-50 transition-colors"><Filter size={18} /></button>
                    <button className="p-2 border rounded-lg hover:bg-slate-50 transition-colors"><Search size={18} /></button>
                </div>
            </div>

            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Fecha y Hora</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Acción</th>
                                <th className="px-6 py-4">Tabla</th>
                                <th className="px-6 py-4">ID Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">Consultando registros de seguridad...</td></tr>
                            ) : (Array.isArray(logs) ? logs : []).map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <History size={12} />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                                {log.usuario?.nombre.substring(0,2).toUpperCase()}
                                            </div>
                                            <span className="font-medium">{log.usuario?.nombre || 'SISTEMA'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getActionBadge(log.accion)}</td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{log.tabla}</td>
                                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{log.registro_id}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && !loading && (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                                    <AlertTriangle className="text-slate-300" size={32} />
                                    No hay registros de auditoría recientes.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PanelAuditoria;
