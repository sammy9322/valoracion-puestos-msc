import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CalculoVP = () => {
  const [data, setData] = useState<any>(null);
  
  const fetchVP = async () => {
    try {
      const res = await api.get('/calculos/vp');
      setData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchVP();
  }, []);

  const handleGuardar = async () => {
     try {
       await api.post('/calculos/vp', {
         total_salarios: data.totalSalarios,
         total_puntos: data.totalPuntos,
         vp_exacto: data.vpExact,
         vp_aplicado: data.vpRedondeado,
         cantidad_puestos: data.items?.length || 0
       });
       alert("Valor del Punto Fijo Registrado en BD exitosamente.");
     } catch (e) {
       console.error("error", e);
     }
  };

  if (!data) return <div className="p-10 text-center">Cargando cálculos financieros...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aritmética del Valor de Punto (VP)</h1>
          <p className="text-sm text-muted-foreground mt-1">Metodología Cuantitativa de Escala.</p>
        </div>
        <button onClick={handleGuardar} className="bg-foreground text-background font-medium px-4 py-2 rounded-md hover:opacity-90">
          Oficializar Periodo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-card border p-5 rounded-md flex flex-col justify-center">
            <span className="text-sm text-muted-foreground font-semibold uppercase">Σ Salarios Mercado</span>
            <span className="text-3xl font-mono mt-1 text-foreground">₡{data.totalSalarios.toLocaleString('es-CR')}</span>
        </div>
        <div className="bg-center flex justify-center items-center font-bold text-3xl text-muted-foreground">
             ÷
        </div>
        <div className="bg-card border p-5 rounded-md flex flex-col justify-center text-right">
            <span className="text-sm text-muted-foreground font-semibold uppercase">Σ Puntos Asignados</span>
            <span className="text-3xl font-bold mt-1 text-foreground">{data.totalPuntos.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-muted/10 border p-6 rounded-md flex flex-col items-center justify-center space-y-2 py-10">
          <span className="uppercase text-sm font-bold tracking-widest text-muted-foreground">Valor del Punto Exacto</span>
          <span className="text-5xl font-extrabold text-foreground tracking-tight">₡{data.vpExact ? data.vpExact.toFixed(2) : '0.00'}</span>
          
          <div className="mt-8 pt-6 border-t border-muted/50 w-full max-w-sm flex justify-between items-center">
             <span className="text-sm text-muted-foreground font-medium">VP Redondeado (Base Real)</span>
             <span className="text-2xl font-bold text-primary">₡{data.vpRedondeado?.toFixed(2) || '0.00'}</span>
          </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col mt-6">
        <div className="bg-muted/30 p-3 border-b border-border">
          <h3 className="text-sm font-semibold">Desglose de Factores Sumados</h3>
        </div>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-muted/10 border-b">
              <th className="px-4 py-3 font-medium text-muted-foreground">Puesto Clave Evaluado</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right w-40">Salario Ancla</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right w-40">Puntos SEVRI</th>
            </tr>
          </thead>
          <tbody>
            {(data.items || []).map((i: any, index: number) => (
             <tr key={index} className="border-b last:border-0 hover:bg-muted/5">
                <td className="px-4 py-3 font-semibold">{i.puesto}</td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">₡{i.salario.toLocaleString('es-CR')}</td>
                <td className="px-4 py-3 text-right font-bold">{i.puntos}</td>
             </tr>
            ))}
            {(data.items || []).length === 0 && (
               <tr>
                 <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Falta Información: Asegúrese de tener Puestos Claves evaluados y con Encuesta Salarial registrada.</td>
               </tr>
            )}
            <tr className="bg-muted/10 border-t-2 font-bold text-foreground">
               <td className="px-4 py-3 font-bold text-right">Totales para Ecuación</td>
               <td className="px-4 py-3 text-right">₡{data.totalSalarios.toLocaleString('es-CR')}</td>
               <td className="px-4 py-3 text-right text-primary">{data.totalPuntos}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalculoVP;
