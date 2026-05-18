import React from 'react';
import { X, Search, Loader2, AlertCircle } from 'lucide-react';
import { EXCLUDED_POSITIONS } from '../config/anomalies';

interface PuestoFormProps {
  showModal: boolean;
  formData: any;
  manualPositions: any[];
  allDepartments: any[];
  isMapping: boolean;
  onClose: () => void;
  onFormDataChange: (data: any) => void;
  onSubmit: (e?: React.FormEvent | React.MouseEvent) => void;
  onManualSelection: (id: string) => void;
  onShowAnomalies: () => void;
}

const PuestoForm: React.FC<PuestoFormProps> = ({
  showModal, formData, manualPositions, allDepartments, isMapping,
  onClose, onFormDataChange, onSubmit, onManualSelection, onShowAnomalies
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-background border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Nueva Ficha de Puesto</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase text-primary block">Seleccionar del Manual Institucional</label>
              {EXCLUDED_POSITIONS.length > 0 && (
                <button
                  type="button"
                  onClick={onShowAnomalies}
                  className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full hover:bg-amber-200 transition-colors flex items-center gap-1"
                >
                  <AlertCircle size={10} /> Ver Anomalías ({EXCLUDED_POSITIONS.length})
                </button>
              )}
            </div>
            <div className="relative">
              <select
                className="w-full bg-background border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                onChange={(e) => onManualSelection(e.target.value)}
                disabled={isMapping}
              >
                <option value="">-- Buscar puesto en el catálogo oficial --</option>
                {manualPositions.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.cargo}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                {isMapping ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">Esto completará automáticamente el área, funciones y requisitos.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Puesto</label>
              <input required className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.nombre} onChange={e => onFormDataChange({...formData, nombre: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Área / Departamento</label>
              <select
                required
                className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                value={formData.area}
                onChange={e => onFormDataChange({...formData, area: e.target.value})}
              >
                <option value="">-- Seleccione un área --</option>
                {allDepartments.map((dept: any) => (
                  <option key={dept.codigo} value={dept.nombre}>
                    {dept.codigo} - {dept.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Estrato (Técnico/Profesional)</label>
              <input className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.estrato} onChange={e => onFormDataChange({...formData, estrato: e.target.value})}
                placeholder="Ej: Técnico 1, Profesional 3" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Reporta a (Cargo)</label>
              <input className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.reporta_a} onChange={e => onFormDataChange({...formData, reporta_a: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Descripción de Funciones</label>
            <textarea
              required
              rows={10}
              className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              style={{ whiteSpace: 'pre-wrap' }}
              value={formData.descripcion_funciones}
              onChange={e => onFormDataChange({...formData, descripcion_funciones: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Educación Requerida</label>
              <input className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.educacion_requerida} onChange={e => onFormDataChange({...formData, educacion_requerida: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Experiencia Requerida</label>
              <input className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.experiencia_requerida} onChange={e => onFormDataChange({...formData, experiencia_requerida: e.target.value})} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="is_clave" className="w-4 h-4 text-primary rounded"
              checked={formData.es_puesto_clave} onChange={e => onFormDataChange({...formData, es_puesto_clave: e.target.checked})} />
            <label htmlFor="is_clave" className="text-sm font-semibold text-foreground">Marcar como Puesto Clave (Benchmark)</label>
          </div>
        </form>
        <div className="p-6 border-t bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Cancelar</button>
          <button onClick={onSubmit} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">Crear Puesto</button>
        </div>
      </div>
    </div>
  );
};

export default PuestoForm;
