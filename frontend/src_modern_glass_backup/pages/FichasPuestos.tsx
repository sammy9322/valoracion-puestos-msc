import React, { useState } from 'react';
import { Plus, CheckCircle2, FileText, ChevronRight, X, UserCircle } from 'lucide-react';

const FichasPuestos = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-foreground">Fichas de Puestos</h1>
          <p className="text-muted-foreground text-lg">Catálogo base de especificaciones para iniciar el Wizard de Valoración.</p>
        </div>
         <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-2xl hover:scale-[1.02] transition-all shadow-lg font-bold"
        >
          {showForm ? <><X size={20} /> Cerrar Formulario</> : <><Plus size={20} /> Nueva Especificación</>}
        </button>
      </div>

      {showForm ? (
        <div className="glass-panel rounded-3xl p-8 lg:p-10 relative overflow-hidden shadow-soft border-2 border-border/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="mb-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0"><FileText size={24} /></div>
            <div>
              <h3 className="text-2xl font-bold">Datos Primarios</h3>
              <p className="text-muted-foreground font-medium mt-1">Estructure las dependencias y obligaciones formales aplicables al modelo.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Título del Puesto <span className="text-destructive">*</span></label>
                <input type="text" className="w-full h-14 px-5 rounded-2xl border-2 bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg" placeholder="Ej. Encargado de Cobros" />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Área Organizacional <span className="text-destructive">*</span></label>
                <select className="w-full h-14 px-5 rounded-2xl border-2 bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-base">
                  <option value="">Seleccionar Departamento...</option>
                  <option value="administracion">Administración General</option>
                  <option value="desarrollo">Desarrollo Urbano y Rural</option>
                  <option value="hacienda">Hacienda Municipal</option>
                </select>
              </div>

              <div>
                 <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Línea de Mando Directo</label>
                 <div className="relative">
                   <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <input type="text" className="w-full h-14 pl-12 pr-5 rounded-2xl border-2 bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" placeholder="Reporta funcionalmente a..." />
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Grado Académico Exigido <span className="text-destructive">*</span></label>
                <select className="w-full h-14 px-5 rounded-2xl border-2 bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium">
                  <option value="">Seleccionar Nivel...</option>
                  <option value="3">Educación Diversificada / Téc. Medio</option>
                  <option value="5">Licenciatura</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Años de Ejercicio Requeridos <span className="text-destructive">*</span></label>
                <select className="w-full h-14 px-5 rounded-2xl border-2 bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium">
                   <option value="">Seleccionar Rango...</option>
                   <option value="2">1 a 2 años</option>
                   <option value="4">Más de 3 años / Senior</option>
                </select>
              </div>

               <div className="mt-8">
                 <label className="flex gap-4 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors">
                    <input type="checkbox" className="w-6 h-6 rounded-md text-primary focus:ring-primary cursor-pointer mt-1" />
                    <div>
                      <span className="block font-extrabold text-primary mb-1">Clasificar como Puesto Clave</span>
                      <span className="block text-sm text-muted-foreground font-medium leading-relaxed">Habilítelo solo si participará como ancla en el Análisis Financiero de Salarios Promedio de Mercado (Fase 2).</span>
                    </div>
                 </label>
               </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Naturaleza del Trabajo <span className="text-destructive">*</span></label>
              <textarea rows={4} className="w-full p-5 text-lg rounded-2xl border-2 bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none" placeholder="Propósito primario del rol en la M.S.C. ..."></textarea>
            </div>
          </div>

          <div className="mt-12 flex justify-end gap-4">
            <button 
              onClick={() => setShowForm(false)}
              className="px-8 py-4 rounded-2xl text-foreground font-bold hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 hover:-translate-y-1 transition-all shadow-glow font-extrabold text-lg">
              Validar y Guardar Registro <CheckCircle2 size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           <div className="glass-panel p-6 rounded-3xl group hover:-translate-y-1 transition-all duration-300 shadow-soft cursor-pointer flex flex-col h-full border-2 border-transparent hover:border-primary/20">
             <div className="flex justify-between items-start mb-6">
                <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider w-fit">En Espera</div>
                <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center font-bold">R</div>
             </div>
             <h3 className="text-2xl font-extrabold text-foreground mb-2">Recepcionista</h3>
             <p className="text-muted-foreground font-medium text-sm mb-6 flex-1">Administración General</p>
             
             <div className="pt-6 border-t border-border flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full">
                  Puesto Ancla
                </span>
                <span className="text-primary font-bold flex items-center gap-1 group-hover:underline">Iniciar Wizard <ChevronRight size={16} /></span>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FichasPuestos;
