import React, { useState } from 'react';
import { AlertCircle, Save, RotateCcw } from 'lucide-react';

interface AdjustmentPanelProps {
  factorKey: string;
  currentGrade: number;
  currentJustification: string;
  onSave: (grade: number, justification: string) => void;
  onCancel: () => void;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({
  factorKey,
  currentGrade,
  currentJustification,
  onSave,
  onCancel
}) => {
  const [grade, setGrade] = useState(currentGrade);
  const [justification, setJustification] = useState(currentJustification);

  return (
    <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 space-y-4 shadow-xl animate-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <AlertCircle size={18} className="text-primary" />
          Ajuste de Auditoría: {factorKey}
        </h3>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-2">Sugerido por IA: Grado {currentGrade}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(g => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  grade === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent'
                }`}
              >
                G{g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-2">Justificación de Sobreescritura Humana</label>
          <textarea
            className="w-full p-3 bg-muted/50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all h-32"
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder="Explique técnicamente por qué el grado de la IA debe ser modificado..."
          />
        </div>
      </div>

      <button
        onClick={() => onSave(grade, justification)}
        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all"
      >
        <Save size={16} /> Aplicar Cambio Técnico
      </button>
    </div>
  );
};

export default AdjustmentPanel;
