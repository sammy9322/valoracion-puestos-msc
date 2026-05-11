import React from 'react';
import { Target, CheckSquare, Square, Info } from 'lucide-react';

const PuestosClave = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-foreground">Identificación Core (Puestos Clave)</h1>
          <p className="text-muted-foreground text-lg">Seleccione los puestos representativos que se usarán como ancla metodológica para el mercado.</p>
        </div>
      </div>

      <div className="glass-panel shadow-soft rounded-3xl overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-8 border-b border-border flex items-center justify-between bg-muted/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
               <Target size={24} />
            </div>
            <div>
               <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">Selección Estratégica</h3>
               <p className="text-sm font-medium text-muted-foreground mt-1">Requisito LGCI: Mínimo 6 puestos con información exógena comprobable.</p>
            </div>
          </div>
          <div className="text-center z-10">
             <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-2">Cuota de Anclaje</p>
            <div className="text-3xl font-black">
              <span className="text-amber-500 drop-shadow-sm">2</span> <span className="text-muted-foreground text-xl">/ 6 seleccionados</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1 p-4">
          <table className="w-full text-left whitespace-nowrap border-separate border-spacing-y-2">
            <thead>
              <tr className="text-muted-foreground text-[11px] font-black uppercase tracking-widest">
                <th className="px-6 py-4 w-16 text-center">Sel.</th>
                <th className="px-6 py-4">Puesto y Nivel</th>
                <th className="px-6 py-4">Área Organizacional</th>
                <th className="px-6 py-4">Justificación Metodológica</th>
              </tr>
            </thead>
            <tbody>
              <tr className="group transition-all bg-primary/5 hover:bg-primary/10 rounded-2xl border-2 border-primary/20 shadow-sm">
                <td className="px-6 py-5 text-primary text-center rounded-l-2xl"><CheckSquare size={24} className="mx-auto" /></td>
                <td className="px-6 py-5 font-bold text-foreground text-lg">Recepcionista</td>
                <td className="px-6 py-5 font-medium text-muted-foreground">Administración General</td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-2 text-primary font-medium text-sm">
                     <Info size={16} /> Puesto base representativo de escala operativa estándar.
                   </div>
                </td>
              </tr>
              <tr className="group transition-all bg-card hover:bg-muted/30 rounded-2xl border-2 border-transparent hover:border-border shadow-sm">
                <td className="px-6 py-5 text-muted-foreground text-center rounded-l-2xl"><Square size={24} className="mx-auto" /></td>
                <td className="px-6 py-5 font-bold text-foreground text-lg">Oficinista I</td>
                <td className="px-6 py-5 font-medium text-muted-foreground">Administración General</td>
                <td className="px-6 py-5 text-muted-foreground text-sm">-</td>
              </tr>
              <tr className="group transition-all bg-primary/5 hover:bg-primary/10 rounded-2xl border-2 border-primary/20 shadow-sm">
                <td className="px-6 py-5 text-primary text-center rounded-l-2xl"><CheckSquare size={24} className="mx-auto" /></td>
                <td className="px-6 py-5 font-bold text-foreground text-lg">Topógrafo</td>
                <td className="px-6 py-5 font-medium text-muted-foreground">Desarrollo Urbano</td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-2 text-primary font-medium text-sm">
                     <Info size={16} /> Referencia técnica superior (Colegio Federado).
                   </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PuestosClave;
