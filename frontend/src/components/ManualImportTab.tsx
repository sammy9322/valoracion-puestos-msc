import React from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, BookOpen, Check } from 'lucide-react';

interface ManualImportTabProps {
  catalogoVigente: any;
  manualFile: File | null;
  manualPreview: any;
  manualLoading: boolean;
  manualError: string | null;
  manualSuccess: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onConfirmar: () => void;
  onReset: () => void;
}

const ManualImportTab: React.FC<ManualImportTabProps> = ({
  catalogoVigente, manualFile, manualPreview, manualLoading,
  manualError, manualSuccess, onFileChange, onUpload, onConfirmar, onReset
}) => {
  return (
    <div className="bg-card border rounded-lg p-6">
      {catalogoVigente?.catalogo && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-sm mb-2">
            <BookOpen size={16} /> Catálogo Vigente Actual
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Versión:</span>{' '}
              <span className="font-medium">v{catalogoVigente.version}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Puestos:</span>{' '}
              <span className="font-medium">{catalogoVigente.catalogo.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Actualizado:</span>{' '}
              <span className="font-medium">
                {catalogoVigente.fecha_importacion
                  ? new Date(catalogoVigente.fecha_importacion).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {manualError && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-lg flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
          <span className="text-red-700 dark:text-red-300 text-sm">{manualError}</span>
        </div>
      )}

      {manualSuccess && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 p-4 rounded-lg flex items-center gap-3 mb-4">
          <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
          <span className="text-green-700 dark:text-green-300 text-sm">{manualSuccess}</span>
        </div>
      )}

      {!manualPreview ? (
        <div className="flex flex-col items-center justify-center gap-6 py-8">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <Upload className="text-muted-foreground" size={32} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-2">Importar Manual MSC</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cargar archivo PDF o DOCX del manual de clases institucional
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors">
              <FileText size={16} />
              <span>Seleccionar archivo</span>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
          </div>
          {manualFile && (
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
                <FileText size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">{manualFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(manualFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={onUpload}
                disabled={manualLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {manualLoading ? 'Procesando...' : 'Procesar archivo'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Vista Previa - Resultados del Parseo</h3>
            <button
              onClick={onReset}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Subir otro archivo
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-2xl font-semibold text-foreground">{manualPreview.preview.resumen.total_clases}</p>
              <p className="text-xs text-muted-foreground">Clases detectadas</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-2xl font-semibold text-foreground">{manualPreview.preview.resumen.total_cargos}</p>
              <p className="text-xs text-muted-foreground">Cargos extraídos</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-2xl font-semibold text-foreground">{manualPreview.preview.resumen.estratos.length}</p>
              <p className="text-xs text-muted-foreground">Estratos ocupados</p>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Clase</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cargos</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {manualPreview.preview.clases_preview.map((clase: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{clase.nombre}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{clase.estrato}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {clase.cargos.map((cargo: any, cidx: number) => (
                          <span key={cidx} className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${
                            cargo.vinculado
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                          }`}>
                            {cargo.vinculado && <Check size={10} />}
                            {cargo.nombre}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {clase.cargos_count} puestos
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onReset}
              className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={manualLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={16} />
              {manualLoading ? 'Guardando...' : 'Confirmar e importar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualImportTab;
