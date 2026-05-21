import React from 'react';
import { CheckCircle2, AlertTriangle, FileText, Info } from 'lucide-react';

interface EvidenceReportProps {
  report: any;
}

const EvidenceReport: React.FC<EvidenceReportProps> = ({ report }) => {
  if (!report) return null;

  const factors = Object.entries(report.evaluacion).filter(([key]) => !key.endsWith('_just'));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-card border rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="text-primary" size={20} />
            Informe de Trazabilidad de Auditoría
          </h3>
          <div className="text-right">
            <span className="text-xs font-bold text-muted-foreground uppercase">Total Puntos</span>
            <p className="text-2xl font-black text-primary">{report.totalPuntos}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {factors.map(([key, value]) => {
            const grade = value as number;
            const justification = report.evaluacion[`${key}_just`];
            return (
              <div key={key} className="p-4 rounded-xl border bg-muted/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{key}</span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                    Grado {grade}
                  </span>
                </div>
                <div className="text-sm text-foreground leading-relaxed italic">
                  "{justification}"
                </div>
              </div>
            );
          })}
        </div>

        {report.warnings && report.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase">
              <AlertTriangle size={14} /> Alertas de Guardrails
            </div>
            <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
              {report.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        <div className="bg-slate-50 border rounded-xl p-4 flex items-center gap-3 text-xs text-slate-500">
          <Info size={14} />
          <span>Motor: {report.auditoria.motor} | Versión: {report.auditoria.buildVersion} | Confianza: {(report.auditoria.confidence * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default EvidenceReport;
