import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { EXCLUDED_POSITIONS } from '../config/anomalies';

interface AnomaliesModalProps {
  showAnomaliesModal: boolean;
  onClose: () => void;
}

const AnomaliesModal: React.FC<AnomaliesModalProps> = ({ showAnomaliesModal, onClose }) => {
  if (!showAnomaliesModal) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-background border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b bg-amber-50/50">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle size={20} />
            <h2 className="text-lg font-bold">Registro de Cuarentena (Anomalías)</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <p className="text-sm text-slate-600 mb-4">
            Los siguientes puestos han sido excluidos automáticamente del catálogo para proteger la integridad de los datos, ya que presentan anomalías en la base de datos externa.
          </p>
          {EXCLUDED_POSITIONS.map(pos => (
            <div key={pos.id} className="bg-slate-50 border rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800">{pos.nombre}</h4>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">ID: {pos.id}</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Clase: {pos.clase}</p>
              <div className="bg-amber-100/50 text-amber-800 text-xs p-3 rounded-lg border border-amber-200">
                <strong>Razón:</strong> {pos.razon}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-bold transition-colors">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnomaliesModal;
