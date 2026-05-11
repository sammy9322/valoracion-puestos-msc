import { useState, useEffect } from 'react';
import { Search, Loader2, Link2, CheckCircle, AlertTriangle, Upload, FileText, Trash2, Edit3 } from 'lucide-react';
import api from '../services/api';

interface Puesto {
  id: string;
  nombre: string;
  area: string;
}

interface Encuesta {
  id: string;
  puesto_id: string;
  periodo: string;
  salario_minimo: number;
  salario_promedio: number;
  salario_maximo: number;
  fuente: string;
  fecha_encuesta: string;
}

const EncuestaSalario = () => {
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [encuestasMap, setEncuestasMap] = useState<Record<string, Encuesta>>({});
  const [loading, setLoading] = useState(true);
  
  // Estados para Inteligencia/Scraping
  const [scanTarget, setScanTarget] = useState<Puesto | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Estados para modo edición
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ min: 0, prom: 0, max: 0, fuente: '' });

  const fetchBases = async () => {
    try {
      setLoading(true);
      const [pRes, eRes] = await Promise.all([
        api.get('/puestos/clave'),
        api.get('/encuestas')
      ]);
      
      setPuestos(pRes.data);
      
      const map: Record<string, Encuesta> = {};
      eRes.data.forEach((e: Encuesta) => {
        map[e.puesto_id] = e;
      });
      setEncuestasMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBases();
  }, []);

  const handleChange = (pId: string, field: string, value: any) => {
    setEncuestasMap(prev => ({
      ...prev,
      [pId]: { 
        ...prev[pId], 
        id: prev[pId]?.id || '',
        puesto_id: pId,
        periodo: new Date().getFullYear().toString(),
        fecha_encuesta: new Date().toISOString(),
        [field]: field === 'fuente' ? value : Number(value)
      } as Encuesta
    }));
  };

  const guardarEstudio = async () => {
    try {
      const payload = Object.keys(encuestasMap).map(pId => ({
        ...encuestasMap[pId],
        puesto_id: pId
      })).filter(d => (d.salario_promedio || 0) > 0);

      if (payload.length === 0) {
        alert("No hay datos válidos para guardar");
        return;
      }

      await api.post('/encuestas/bulk', { encuestas: payload });
      alert("Estudio de mercado guardado para Puestos Clave");
      fetchBases();
    } catch (e) {
      console.error(e);
      alert("Error guardando estudio");
    }
  };

  const handleScrape = async (puesto: Puesto) => {
    setScanTarget(puesto);
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    try {
      const res = await api.get(`/encuestas/scraping?puesto=${encodeURIComponent(puesto.nombre)}`);
      if (res.data.success) {
        setScanResult(res.data.data);
      } else {
        setScanError(res.data.error || 'Error en la búsqueda');
      }
    } catch (e: any) {
      console.error(e);
      setScanError(e.response?.data?.error || "Error contactando fuentes externas");
    } finally {
      setIsScanning(false);
    }
  };

  const aplicarSondeo = () => {
    if (scanTarget && scanResult) {
      handleChange(scanTarget.id, 'salario_minimo', scanResult.salario_minimo);
      handleChange(scanTarget.id, 'salario_promedio', scanResult.salario_promedio);
      handleChange(scanTarget.id, 'salario_maximo', scanResult.salario_maximo);
      handleChange(scanTarget.id, 'fuente', scanResult.fuente);
      setScanTarget(null);
      setScanResult(null);
    }
  };

  const startEdit = (pId: string) => {
    const enc = encuestasMap[pId];
    if (enc) {
      setEditingId(pId);
      setEditValues({
        min: enc.salario_minimo,
        prom: enc.salario_promedio,
        max: enc.salario_maximo,
        fuente: enc.fuente
      });
    }
  };

  const saveEdit = (pId: string) => {
    handleChange(pId, 'salario_minimo', editValues.min);
    handleChange(pId, 'salario_promedio', editValues.prom);
    handleChange(pId, 'salario_maximo', editValues.max);
    handleChange(pId, 'fuente', editValues.fuente);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ min: 0, prom: 0, max: 0, fuente: '' });
  };

  const getUrlFromFuente = (fuente: string | undefined): string | null => {
    if (!fuente) return null;
    const lower = fuente.toLowerCase();
    if (lower.includes('gaceta')) return 'https://www.imprentanacional.go.cr/gaceta/';
    if (lower.includes('mtts') || lower.includes('ministerio')) return 'https://www.mtss.go.cr/';
    if (lower.includes('dgsc')) return 'https://www.dgsc.go.cr/';
    if (lower.includes('municipal')) return 'https://www.cs.go.cr/';
    return null;
  };

  if (loading) return <div className="p-10 text-center">Cargando puestos clave...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Encuesta Salarial</h1>
          <p className="text-sm text-muted-foreground mt-1">Sondeo de mercado de trabajo y tendencia central.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border bg-card rounded-md hover:bg-muted transition-colors">
            <Upload size={16} /> Importar CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border bg-card rounded-md hover:bg-muted transition-colors">
            <FileText size={16} /> Exportar
          </button>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-md text-sm text-orange-800 mb-6">
         <div className="flex items-start gap-2">
           <AlertTriangle size={16} className="mt-0.5 shrink-0" />
           <div>
             <strong>Nota Contraloría:</strong> El Promedio de Mercado Oficial es la variable inelástica para el cálculo de puntos. Requiere sustentación estricta de la fuente.
             <p className="text-xs mt-1 opacity-80">Cumplimiento SEVRI: R16 - Auditoría completa deSalary Data</p>
           </div>
         </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="px-4 py-3 font-medium text-muted-foreground">Puesto Clave</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right w-32">Mínimo (₡)</th>
                <th className="px-4 py-3 font-medium text-foreground bg-muted/50 border-x text-right w-40">Salario Promedio</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right w-32">Máximo (₡)</th>
                <th className="px-4 py-3 font-medium text-muted-foreground w-64">Documento Referencia</th>
                <th className="px-4 py-3 font-medium text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {puestos.map(p => {
                const data = encuestasMap[p.id];
                const isEditing = editingId === p.id;
                
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/5">
                    <td className="px-4 py-4 font-semibold text-foreground">{p.nombre}</td>
                    
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <input 
                            type="number" 
                            value={editValues.min} 
                            onChange={e => setEditValues({...editValues, min: Number(e.target.value)})}
                            className="w-full h-8 px-2 rounded border text-right font-mono text-sm bg-background" 
                          />
                        </td>
                        <td className="px-4 py-2 bg-muted/10 border-x">
                          <input 
                            type="number" 
                            value={editValues.prom} 
                            onChange={e => setEditValues({...editValues, prom: Number(e.target.value)})}
                            className="w-full h-8 px-2 font-bold text-right text-base rounded border-primary/40 bg-background" 
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="number" 
                            value={editValues.max} 
                            onChange={e => setEditValues({...editValues, max: Number(e.target.value)})}
                            className="w-full h-8 px-2 rounded border text-right font-mono text-sm bg-background" 
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={editValues.fuente} 
                            onChange={e => setEditValues({...editValues, fuente: e.target.value})}
                            className="w-full h-8 px-2 rounded border text-xs bg-background" 
                            placeholder="Fuente..."
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => saveEdit(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Guardar">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 text-muted-foreground hover:bg-muted rounded" title="Cancelar">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-4">
                          <input 
                            type="number" 
                            value={data?.salario_minimo || ''} 
                            onChange={e => handleChange(p.id, 'salario_minimo', e.target.value)} 
                            className="w-full h-8 px-2 rounded border text-right font-mono text-sm bg-background text-foreground" 
                            placeholder="0" 
                          />
                        </td>
                        <td className="px-4 py-4 bg-muted/10 border-x">
                          <input 
                            type="number" 
                            value={data?.salario_promedio || ''} 
                            onChange={e => handleChange(p.id, 'salario_promedio', e.target.value)} 
                            className="w-full h-9 px-2 font-bold text-right text-base rounded border-primary/40 focus:border-primary focus:ring-1 text-foreground bg-background" 
                            placeholder="0" 
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input 
                            type="number" 
                            value={data?.salario_maximo || ''} 
                            onChange={e => handleChange(p.id, 'salario_maximo', e.target.value)} 
                            className="w-full h-8 px-2 rounded border text-right font-mono text-sm bg-background text-foreground" 
                            placeholder="0" 
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={data?.fuente || ''} 
                              onChange={e => handleChange(p.id, 'fuente', e.target.value)} 
                              className="w-full h-8 px-2 rounded border text-xs bg-background text-foreground" 
                              placeholder="MTSS / Encuesta..." 
                            />
                            {data?.fuente && getUrlFromFuente(data.fuente) && (
                              <a 
                                href={getUrlFromFuente(data.fuente) || ''}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-primary hover:bg-primary/10 rounded"
                                title="Ver fuente"
                              >
                                <Link2 size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => startEdit(p.id)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors" 
                              title="Editar"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleScrape(p)} 
                              title="Sondeo Inteligente en Gaceta/Munis" 
                              className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors flex justify-center items-center"
                            >
                              <Search size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
              {puestos.length === 0 && (
                 <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No hay puestos clave. Primero defina fichas clave en Puestos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t bg-muted/10 flex justify-between items-center text-sm">
            <span className="font-medium text-muted-foreground">{puestos.length} puestos ancla detectados.</span>
            <button onClick={guardarEstudio} className="px-5 py-2 bg-foreground text-background font-medium rounded-md text-sm">
              Guardar Estudio
            </button>
        </div>
      </div>

      {/* Modal de Sondeo Inteligente */}
      {scanTarget && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border shadow-2xl rounded-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
             
             {isScanning ? (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                   <Loader2 size={48} className="animate-spin text-primary" />
                   <h3 className="text-xl font-bold">Escaneando Fuentes Oficiales...</h3>
                   <p className="text-sm text-muted-foreground w-64">Buscando coincidencias para <strong>"{scanTarget.nombre}"</strong> en La Gaceta y Repositorios Municipales (.go.cr)</p>
                </div>
             ) : scanError ? (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                   <AlertTriangle size={48} className="text-orange-500" />
                   <h3 className="text-xl font-bold text-orange-600">Error en la Búsqueda</h3>
                   <p className="text-sm text-muted-foreground">{scanError}</p>
                   <button onClick={() => setScanTarget(null)} className="px-4 py-2 text-sm font-medium border rounded-md">
                     Cerrar
                   </button>
                </div>
             ) : scanResult && (
                <div className="flex flex-col">
                   <div className="p-6 border-b bg-muted/20">
                     <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-foreground">Sondeo Encontrado</h3>
                          <p className="text-sm text-muted-foreground">Para: {scanTarget.nombre}</p>
                        </div>
                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold border border-green-200 flex items-center gap-1">
                          <CheckCircle size={12} /> Confiabilidad {scanResult.tasa_confiabilidad}
                        </div>
                     </div>
                   </div>

                   <div className="p-6 space-y-6">
                      <div className="flex gap-4">
                         <div className="flex-1 bg-background border rounded-lg p-3 text-center">
                            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Mínimo Detectado</span>
                            <span className="font-mono font-semibold text-foreground">₡{scanResult.salario_minimo.toLocaleString('es-CR')}</span>
                         </div>
                         <div className="flex-1 bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                            <span className="block text-[10px] uppercase font-bold text-primary mb-1">Promedio General</span>
                            <span className="font-bold text-lg text-primary">₡{scanResult.salario_promedio.toLocaleString('es-CR')}</span>
                         </div>
                         <div className="flex-1 bg-background border rounded-lg p-3 text-center">
                            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Máximo Detectado</span>
                            <span className="font-mono font-semibold text-foreground">₡{scanResult.salario_maximo.toLocaleString('es-CR')}</span>
                         </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1"><Link2 size={14}/> Fuentes Bibliográficas (Auditoría)</p>
                        <div className="bg-muted/30 p-3 rounded border text-xs text-foreground font-medium space-y-2">
                          <p className="font-semibold">{scanResult.fuente}</p>
                          <div className="flex flex-wrap gap-2">
                            {scanResult.url_fuente && (
                              <a 
                                href={scanResult.url_fuente} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded border shadow-sm text-xs"
                              >
                                <Link2 size={12}/> Gaceta/MTS
                              </a>
                            )}
                            {scanResult.urls_adicionales?.map((url: string, i: number) => (
                              <a 
                                key={i}
                                href={url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-200 shadow-sm text-xs"
                              >
                                <Link2 size={12}/> Fuente #{i+1}
                              </a>
                            ))}
                          </div>
                          <p className="text-[10px] text-orange-600 italic mt-1">
                            ⚠️ Nota: Verifique manualmente estos datos en las fuentes oficiales antes de aplicar.
                          </p>
                        </div>
                      </div>
                   </div>

                   <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
                      <button onClick={() => { setScanTarget(null); setScanResult(null); }} className="px-4 py-2 text-sm font-medium hover:bg-muted border rounded-md">
                        Cancelar
                      </button>
                      <button onClick={aplicarSondeo} className="px-5 py-2 text-sm font-medium bg-foreground text-background border rounded-md shadow-sm">
                        Aplicar a mi Estudio
                      </button>
                   </div>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EncuestaSalario;
