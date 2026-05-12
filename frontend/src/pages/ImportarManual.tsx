import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Clock, ArrowLeft, Package } from 'lucide-react';
import api from '../services/api';

interface ResumenPreview {
  total_clases: number;
  total_cargos: number;
  estratos: string[];
}

interface ClasePreview {
  nombre: string;
  estrato: string;
  cargos_count: number;
}

const ImportarManual: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    resumen: ResumenPreview;
    clases_preview: ClasePreview[];
    version: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [catalogoVigente, setCatalogoVigente] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);

  const fetchCatalogoVigente = useCallback(async () => {
    try {
      const res = await api.get('/manual/vigente');
      setCatalogoVigente(res.data);
    } catch (e) {
      console.error('Error fetching catalogo:', e);
    }
  }, []);

  const fetchHistorial = useCallback(async () => {
    try {
      const res = await api.get('/manual/historial');
      setHistorial(res.data);
    } catch (e) {
      console.error('Error fetching historial:', e);
    }
  }, []);

  React.useEffect(() => {
    fetchCatalogoVigente();
    fetchHistorial();
  }, [fetchCatalogoVigente, fetchHistorial]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.toLowerCase().split('.').pop();
      if (ext === 'pdf' || ext === 'docx') {
        setFile(selected);
        setError(null);
        setPreview(null);
        setSuccess(null);
      } else {
        setError('Formato no válido. Use archivos PDF o DOCX.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const res = await api.post('/manual/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPreview(res.data);
      if (res.data.saved) {
        setSuccess(res.data.message);
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/manual/confirmar');
      setSuccess(res.data.message);
      setPreview(null);
      setFile(null);
      fetchCatalogoVigente();
      fetchHistorial();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al confirmar importación');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Importar Manual MSC</h1>
        <p className="text-sm text-muted-foreground">Cargar y actualizar el catálogo de puestos desde el Manual de Clases</p>
      </div>

      {catalogoVigente && catalogoVigente.catalogo && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-sm mb-2">
            <Package size={16} />
            Catálogo Vigente Actual
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

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
          <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
          <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
        </div>
      )}

      {!preview ? (
        <div className="bg-card border rounded-lg p-8">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <Upload className="text-muted-foreground" size={32} />
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-2">Seleccionar archivo del manual</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Formatos aceptados: PDF, DOCX
              </p>
              
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors">
                <FileText size={16} />
                <span>Seleccionar archivo</span>
                <input 
                  type="file" 
                  accept=".pdf,.docx" 
                  onChange={handleFileChange} 
                  className="hidden"
                />
              </label>
            </div>

            {file && (
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
                  <FileText size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Procesando...' : 'Procesar archivo'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Vista Previa - Resultados del Parseo</h3>
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} className="inline mr-1" />
                Subir otro archivo
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <p className="text-2xl font-semibold text-foreground">{preview.preview.resumen.total_clases}</p>
                <p className="text-xs text-muted-foreground">Clases detectadas</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <p className="text-2xl font-semibold text-foreground">{preview.preview.resumen.total_cargos}</p>
                <p className="text-xs text-muted-foreground">Cargos extraídos</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <p className="text-2xl font-semibold text-foreground">{preview.preview.resumen.estratos.length}</p>
                <p className="text-xs text-muted-foreground">Estratos ocupados</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Estratos encontrados: {preview.preview.resumen.estratos.join(', ')}
              </h4>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">Clase</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Estrato</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Cargos</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.clases_preview.map((clase: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{clase.nombre}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-muted rounded text-xs">{clase.estrato}</span>
                      </td>
                      <td className="p-3 text-center">{clase.cargos_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {preview.preview.clases_preview.length < preview.preview.resumen.total_clases && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                ...y {preview.preview.resumen.total_clases - preview.preview.clases_preview.length} clases más
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={16} />
              {loading ? 'Guardando...' : 'Confirmar e importar'}
            </button>
          </div>
        </div>
      )}

      {historial.length > 0 && (
        <div className="bg-card border rounded-lg p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Historial de importaciones</h3>
          </div>
          <div className="space-y-2">
            {historial.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                <span className="text-sm font-medium">Versión {item.version}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.fecha_importacion).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportarManual;