import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { getCategoriaByPuntos } from '../constants/categorias';

const Asignaciones = () => {
  const [data, setData] = useState<{ vp: number, cruce: any[] } | null>(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/asignaciones/cruce');
      setData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const publicar = async () => {
    try {
      await api.post('/asignaciones/publicar', { asignaciones: data?.cruce });
      alert("Escala Salarial Publicada a ERP satisfactoriamente.");
    } catch (e) {
      console.error(e);
    }
  };

  if (!data) return <div className="p-10 text-center">Construyendo semaforización...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Armonización Salarial (Cruce MTSS)</h1>
          <p className="text-sm text-muted-foreground mt-1">Contraste vs Decreto de Salarios Mínimos.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right mr-4 border-r pr-4">
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-0.5">Valor Punto Activo</p>
              <div className="font-semibold text-xl text-primary">₡{data.vp.toFixed(2)}</div>
           </div>
           <button onClick={publicar} className="flex items-center gap-2 bg-foreground text-background font-medium px-4 py-2 rounded-md hover:bg-foreground/90 transition-colors">
            Publicar Escala
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="px-4 py-3 font-medium text-muted-foreground">Puesto Municipal</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Puntos Totales</th>
                <th className="px-4 py-3 font-medium text-muted-foreground w-40 text-center">Clasificación CAM</th>
                <th className="px-4 py-3 font-medium text-foreground bg-muted/20 border-x text-right">Salario Generado</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right w-40">Mínimo Ley MTSS</th>
                <th className="px-4 py-3 font-medium text-muted-foreground w-40 text-center">Estado Auditoría</th>
              </tr>
            </thead>
            <tbody>
              {data.cruce.map((c: any) => {
                const cat = getCategoriaByPuntos(c.puntos);
                return (
                  <tr key={c.evaluacion_id} className="border-b last:border-0 hover:bg-muted/5">
                    <td className="px-4 py-3 font-semibold text-foreground">{c.puesto_nombre}</td>
                    <td className="px-4 py-3 text-center font-bold text-primary">{c.puntos}</td>
                    <td className="px-4 py-3 text-center">
                      {cat ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-white shadow-sm text-foreground">{cat.nombre}</span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold opacity-30 italic">Operativo</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 bg-muted/5 border-x font-mono text-base text-right font-bold ${c.isUnderMin ? 'text-destructive' : 'text-foreground'}`}>
                      ₡{c.calculo_base.toLocaleString('es-CR')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">
                      ₡{c.minimo_legal.toLocaleString('es-CR')}
                    </td>
                    <td className="px-4 py-3">
                      {c.isUnderMin ? (
                        <div className="flex items-center justify-center gap-1.5 px-2 py-1 bg-destructive/10 text-destructive rounded-md text-xs font-semibold">
                           <AlertCircle size={14} /> Deficit
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-700 rounded-md text-xs font-semibold">
                           <CheckCircle size={14} /> Conforme
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data.cruce.length === 0 && (
                <tr>
                   <td colSpan={6} className="p-8 text-center text-muted-foreground">No hay evaluaciones registradas. Debe evaluar Fichas para que aparezcan en el Cruce Salarial.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Asignaciones;
