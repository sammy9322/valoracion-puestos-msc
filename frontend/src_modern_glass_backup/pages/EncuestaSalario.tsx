import React from 'react';
import { UploadCloud, AlertCircle, TrendingUp, Save } from 'lucide-react';

const EncuestaSalario = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-foreground">Sondeo de Mercado de Trabajo</h1>
          <p className="text-muted-foreground text-lg">Definición de Salarios representativos para el cálculo base de Valor de Punto.</p>
        </div>
        <button className="flex items-center gap-3 glass-panel px-6 py-3 rounded-2xl hover:bg-muted font-bold transition-all shadow-sm border-2 border-border">
          <UploadCloud size={20} className="text-primary" /> Importar Origen de Datos (CSV/Excel)
        </button>
      </div>

      <div className="p-6 border-2 border-blue-500/20 bg-blue-500/5 rounded-3xl flex gap-4 items-start shadow-sm mb-4">
         <div className="w-10 h-10 bg-blue-500/20 text-blue-600 rounded-full flex items-center justify-center shrink-0 mt-1"><AlertCircle size={20} /></div>
         <div>
            <h4 className="font-bold text-blue-700 dark:text-blue-500 mb-1">Algoritmo Dependiente de la Tendencia Central</h4>
            <p className="text-blue-700/80 dark:text-blue-300/80 text-sm leading-relaxed font-medium">El Promedio de Mercado es el ancla absoluta de la metodología de puntos, asegúrese de ingresar valores verificables ante Contraloría.</p>
         </div>
      </div>

      <div className="glass-panel shadow-soft rounded-3xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1 p-2">
          <table className="w-full text-left whitespace-nowrap border-separate border-spacing-y-2 px-4">
            <thead>
              <tr className="text-muted-foreground text-[11px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Ficha Anclada</th>
                <th className="px-6 py-4">Salario Mínimo (₡)</th>
                <th className="px-6 py-4">
                  <span className="flex items-center gap-2 bg-primary/10 text-primary w-fit px-3 py-1 rounded-lg border border-primary/20">
                     <TrendingUp size={14}/> Promedio Oficial (₡)
                  </span>
                </th>
                <th className="px-6 py-4">Salario Máximo (₡)</th>
                <th className="px-6 py-4">Estudio Fuente</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-card hover:bg-muted/30 rounded-2xl shadow-sm transition-all group">
                <td className="px-6 py-5 rounded-l-2xl font-bold text-foreground text-lg">Recepcionista</td>
                <td className="px-6 py-5">
                  <input type="number" className="w-full h-12 px-4 rounded-xl border-2 bg-background focus:outline-none focus:border-primary/50 text-sm font-mono transition-all" defaultValue="285000" />
                </td>
                <td className="px-6 py-5">
                  <input type="number" className="w-full h-14 bg-primary/5 px-4 font-black text-lg text-primary rounded-xl border-2 border-primary/30 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-inner" defaultValue="315000" />
                </td>
                <td className="px-6 py-5">
                  <input type="number" className="w-full h-12 px-4 rounded-xl border-2 bg-background focus:outline-none focus:border-primary/50 text-sm font-mono transition-all" defaultValue="410000" />
                </td>
                <td className="px-6 py-5 rounded-r-2xl">
                  <input type="text" className="w-full h-12 px-4 rounded-xl border-2 bg-background focus:outline-none focus:border-primary/50 text-sm transition-all" defaultValue="Encuesta MTSS N.Z." />
                </td>
              </tr>
              <tr className="bg-card hover:bg-muted/30 rounded-2xl shadow-sm transition-all group">
                <td className="px-6 py-5 rounded-l-2xl font-bold text-foreground text-lg">Topógrafo</td>
                <td className="px-6 py-5">
                  <input type="number" className="w-full h-12 px-4 rounded-xl border-2 bg-background focus:outline-none focus:border-primary/50 text-sm font-mono transition-all" placeholder="Mínimo" />
                </td>
                <td className="px-6 py-5">
                  <input type="number" className="w-full h-14 bg-primary/5 px-4 font-black text-lg text-primary rounded-xl border-2 border-primary/30 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-inner" placeholder="Requerido" />
                </td>
                <td className="px-6 py-5">
                  <input type="number" className="w-full h-12 px-4 rounded-xl border-2 bg-background focus:outline-none focus:border-primary/50 text-sm font-mono transition-all" placeholder="Máximo" />
                </td>
                <td className="px-6 py-5 rounded-r-2xl">
                  <input type="text" className="w-full h-12 px-4 rounded-xl border-2 bg-background focus:outline-none focus:border-primary/50 text-sm transition-all" placeholder="Referencia oficial" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="p-6 md:px-10 border-t border-border bg-background flex justify-between items-center">
            <span className="text-sm text-amber-600 dark:text-amber-500 font-extrabold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Faltan 5 puestos clave para viabilizar el cálculo VP.</span>
            <button className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl hover:opacity-90 shadow-glow text-base font-black transition-all hover:-translate-y-0.5">
              Refrescar Estudio <Save size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default EncuestaSalario;
