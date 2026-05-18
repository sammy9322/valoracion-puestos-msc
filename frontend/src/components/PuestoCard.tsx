import React from 'react';
import { Briefcase, FileText, Clock, Trash2, Target } from 'lucide-react';

interface PuestoCardProps {
  puesto: any;
  onDelete: (id: string) => void;
}

const getStatusBadge = (estado: string) => {
  const styles: any = {
    'borrador': 'bg-slate-100 text-slate-600 border-slate-200',
    'evaluado': 'bg-blue-50 text-blue-600 border-blue-200',
    'aprobado': 'bg-green-50 text-green-600 border-green-200',
    'eliminado': 'bg-red-50 text-red-600 border-red-200'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${styles[estado] || styles.borrador}`}>
      {estado}
    </span>
  );
};

const PuestoCard: React.FC<PuestoCardProps> = ({ puesto, onDelete }) => {
  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
      {puesto.es_puesto_clave && (
        <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase flex items-center gap-1">
          <Target size={10} /> Puesto Clave
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
          <Briefcase size={24} />
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(puesto.id);
            }}
            className="text-slate-300 hover:text-destructive p-2 rounded-lg transition-colors relative z-20 cursor-pointer"
            title="Eliminar Puesto"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg leading-tight">{puesto.nombre}</h3>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
          <FileText size={12} /> {puesto.area}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusBadge(puesto.estado)}
          {puesto.estado !== 'aprobado' && (
            <a
              href={`/wizard-evaluacion?puesto_id=${puesto.id}`}
              className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary hover:text-white transition-all font-bold uppercase"
            >
              Evaluar
            </a>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
          <Clock size={12} /> {new Date(puesto.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default PuestoCard;
