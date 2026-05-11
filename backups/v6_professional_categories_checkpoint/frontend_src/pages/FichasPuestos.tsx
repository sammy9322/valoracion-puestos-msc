import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Puesto {
  id: string;
  nombre: string;
  area: string;
  estado: string;
  es_puesto_clave: boolean;
}

const FichasPuestos = () => {
  const [showForm, setShowForm] = useState(false);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    area: '',
    reporta_a: '',
    educacion_requerida: '',
    experiencia_requerida: '',
    descripcion_funciones: '',
    es_puesto_clave: false
  });

  const fetchPuestos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/puestos');
      setPuestos(res.data);
    } catch (error) {
      console.error('Error fetching puestos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPuestos();
  }, []);

  const handleSubmit = async () => {
    try {
      await api.post('/puestos', formData);
      setShowForm(false);
      setFormData({
        nombre: '', area: '', reporta_a: '',
        educacion_requerida: '', experiencia_requerida: '',
        descripcion_funciones: '', es_puesto_clave: false
      });
      fetchPuestos();
    } catch (error) {
      console.error('Error saving puesto:', error);
      alert('Hubo un error al guardar la ficha.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fichas de Especificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">Registro y catalogación de puestos municipales.</p>
        </div>
         <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          {showForm ? 'Cerrar Formulario' : 'Nueva Ficha'}
        </button>
      </div>

      {showForm ? (
        <div className="bg-card border rounded-lg shadow-sm p-6 overflow-hidden">
          <div className="mb-6 border-b pb-4">
            <h3 className="text-lg font-semibold">Creación de Especificación</h3>
            <p className="text-sm text-muted-foreground">Registre la información formal aplicable.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Título del Puesto</label>
                <input 
                  type="text" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full h-10 px-3 text-sm rounded-md border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background" 
                  placeholder="Ej. Encargado de Cobros" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Área Organizacional</label>
                <select 
                  value={formData.area}
                  onChange={e => setFormData({...formData, area: e.target.value})}
                  className="w-full h-10 px-3 text-sm rounded-md border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Administración General">Administración General</option>
                  <option value="Desarrollo Urbano">Desarrollo Urbano</option>
                  <option value="Hacienda Municipal">Hacienda Municipal</option>
                </select>
              </div>

              <div>
                 <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reporta a</label>
                 <input 
                   type="text" 
                   value={formData.reporta_a}
                   onChange={e => setFormData({...formData, reporta_a: e.target.value})}
                   className="w-full h-10 px-3 text-sm rounded-md border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background" 
                   placeholder="Jefatura Directa..." 
                 />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nivel Educativo</label>
                <select 
                  value={formData.educacion_requerida}
                  onChange={e => setFormData({...formData, educacion_requerida: e.target.value})}
                  className="w-full h-10 px-3 text-sm rounded-md border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Técnico Medio / Colegial">Técnico Medio / Colegial</option>
                  <option value="Licenciatura">Licenciatura</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Experiencia</label>
                <select 
                  value={formData.experiencia_requerida}
                  onChange={e => setFormData({...formData, experiencia_requerida: e.target.value})}
                  className="w-full h-10 px-3 text-sm rounded-md border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background"
                >
                   <option value="">Seleccionar...</option>
                   <option value="1 - 2 años">1 a 2 años</option>
                   <option value="3+ años">3+ años</option>
                </select>
              </div>

               <div className="pt-2">
                 <label className="flex items-start gap-3 p-3 rounded-md border bg-muted/10 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.es_puesto_clave}
                      onChange={e => setFormData({...formData, es_puesto_clave: e.target.checked})}
                      className="mt-1" 
                    />
                    <div>
                      <span className="block text-sm font-semibold text-foreground">Clasificar como Puesto Clave</span>
                      <span className="block text-xs text-muted-foreground">Requerido para ser ancla metodológica (Sprint 2).</span>
                    </div>
                 </label>
               </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Naturaleza y Notas Generales</label>
              <textarea 
                rows={3} 
                value={formData.descripcion_funciones}
                onChange={e => setFormData({...formData, descripcion_funciones: e.target.value})}
                className="w-full p-3 text-sm rounded-md border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background resize-none" 
                placeholder="Propósito primario..."
              ></textarea>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-5 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors">Cancelar</button>
            <button onClick={handleSubmit} className="px-5 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">Guardar Ficha</button>
          </div>
        </div>
      ) : (
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
           <table className="w-full text-sm text-left">
             <thead className="bg-muted/30 border-b">
               <tr>
                 <th className="px-4 py-3 font-medium text-muted-foreground">Puesto / Ficha ID</th>
                 <th className="px-4 py-3 font-medium text-muted-foreground">Categoría</th>
                 <th className="px-4 py-3 font-medium text-muted-foreground">Área Municipal</th>
                 <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
               </tr>
             </thead>
             <tbody>
               {loading ? (
                 <tr>
                   <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Cargando base de datos...</td>
                 </tr>
               ) : puestos.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No hay fichas registradas.</td>
                 </tr>
               ) : (
                 puestos.map(p => (
                   <tr key={p.id} className="border-b last:border-0 hover:bg-muted/10 cursor-pointer transition-colors">
                     <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{p.id.split('-')[0]}</td>
                     <td className="px-4 py-3">
                       <div className="font-semibold text-sm text-foreground">{p.nombre}</div>
                       <div className="text-xs text-muted-foreground">{p.es_puesto_clave ? 'Puesto Clave' : 'Regular'}</div>
                     </td>
                     <td className="px-4 py-3 text-muted-foreground">{p.area || 'Sin clasificar'}</td>
                     <td className="px-4 py-3">
                       <span className={`px-2 py-1 rounded text-xs font-semibold ${p.estado === 'evaluado' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                         {p.estado === 'evaluado' ? 'Evaluado' : 'Pendiente Evaluacion'}
                       </span>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default FichasPuestos;
