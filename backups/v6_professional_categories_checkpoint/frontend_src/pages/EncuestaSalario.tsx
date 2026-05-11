import React, { useState, useEffect } from 'react';
import { Search, Loader2, Link2, CheckCircle } from 'lucide-react';
import api from '../services/api';

const EncuestaSalario = () => {
  const [puestos, setPuestos] = useState<any[]>([]);
  const [encuestasMap, setEncuestasMap] = useState<Record<string, any>>({});
  
  // Estados para Inteligencia/Scraping
  const [scanTarget, setScanTarget] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  
  const fetchBases = async () => {
    try {
      const pRes = await api.get('/puestos/clave');
      setPuestos(pRes.data);

      const eRes = await api.get('/encuestas');
      const map: Record<string, any> = {};
      
      pRes.data.forEach((p: any) => {
         const existing = eRes.data.find((e: any) => e.puesto_id === p.id);
         map[p.id] = existing || { salario_minimo: 0, salario_promedio: 0, salario_maximo: 0, fuente: '' };
      });
      setEncuestasMap(map);

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBases();
  }, []);

  const handleChange = (pId: string, f: keyof any, v: any) => {
     setEncuestasMap(prev => ({
       ...prev,
       [pId]: { ...prev[pId], [f]: v }
     }));
  };

  const guardarEstudio = async () => {
     try {
       // Guardamos uno por uno en la API
       const promises = Object.keys(encuestasMap).map(pId => {
         const d = encuestasMap[pId];
         if (d.salario_promedio > 0) {
           return api.post('/encuestas', {
             puesto_id: pId,
             salario_minimo: Number(d.salario_minimo),
             salario_promedio: Number(d.salario_promedio),
             salario_maximo: Number(d.salario_maximo),
             fuente: d.fuente || 'Manual MSC'
           });
         }
         return Promise.resolve();
       });
       await Promise.all(promises);
       alert("Estudio de mercado guardado para Puestos Clave");
       fetchBases();
     } catch (e) {
       console.error(e);
       alert("Error guardando estudio");
     }
  };

  const handleScrape = async (puesto: any) => {
    setScanTarget(puesto);
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await api.get(`/encuestas/scraping?puesto=${encodeURIComponent(puesto.nombre)}`);
      setScanResult(res.data.data);
    } catch (e) {
      console.error(e);
      alert("Error contactando fuentes externas");
      setScanTarget(null);
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Encuesta Salarial</h1>
          <p className="text-sm text-muted-foreground mt-1">Sondeo de mercado de trabajo y tendencia central.</p>
        </div>
        <button className="text-sm font-medium border bg-card px-4 py-2 rounded-md hover:bg-muted transition-colors">
          Importar CSV
        </button>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-md text-sm text-orange-800 mb-6">
         <strong>Nota Contraloría:</strong> El Promedio de Mercado Oficial es la variable inelástica para el cálculo de puntos. Requiere sustentación estricta de la fuente.
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
                <th className="px-4 py-3 font-medium text-center w-16">IA</th>
              </tr>
            </thead>
            <tbody>
              {puestos.map(p => {
                const data = encuestasMap[p.id] || {};
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/5">
                    <td className="px-4 py-4 font-semibold text-foreground">{p.nombre}</td>
                    <td className="px-4 py-4">
                      <input type="number" value={data.salario_minimo || ''} onChange={e => handleChange(p.id, 'salario_minimo', e.target.value)} className="w-full h-8 px-2 rounded border text-right font-mono text-sm bg-background text-foreground" placeholder="0" />
                    </td>
                    <td className="px-4 py-4 bg-muted/10 border-x">
                      <input type="number" value={data.salario_promedio || ''} onChange={e => handleChange(p.id, 'salario_promedio', e.target.value)} className="w-full h-9 px-2 font-bold text-right text-base rounded border-primary/40 focus:border-primary focus:ring-1 text-foreground bg-background" placeholder="0" />
                    </td>
                    <td className="px-4 py-4">
                      <input type="number" value={data.salario_maximo || ''} onChange={e => handleChange(p.id, 'salario_maximo', e.target.value)} className="w-full h-8 px-2 rounded border text-right font-mono text-sm bg-background text-foreground" placeholder="0" />
                    </td>
                    <td className="px-4 py-4">
                      <input type="text" value={data.fuente || ''} onChange={e => handleChange(p.id, 'fuente', e.target.value)} className="w-full h-8 px-2 rounded border text-xs bg-background text-foreground" placeholder="MTSS / Encuesta..." />
                    </td>
                    <td className="px-4 py-4 text-center">
                       <button onClick={() => handleScrape(p)} title="Sondeo Inteligente en Gaceta/Munis" className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors flex justify-center items-center">
                         <Search size={16} />
                       </button>
                    </td>
                  </tr>
                )
              })}
              {puestos.length === 0 && (
                 <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No hay puestos clave. Primero defina fichas clave en Puestos.</td></tr>
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

      {scanTarget && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border shadow-2xl rounded-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
             
             {isScanning ? (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                   <Loader2 size={48} className="animate-spin text-primary" />
                   <h3 className="text-xl font-bold">Escaneando Fuentes Oficiales...</h3>
                   <p className="text-sm text-muted-foreground w-64">Buscando coincidencias para <strong>"{scanTarget.nombre}"</strong> en La Gaceta y Repositorios Municipales (.go.cr)</p>
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
                        <div className="bg-muted/30 p-3 rounded border text-xs text-foreground font-medium flex justify-between items-center group">
                          <span>{scanResult.fuente}</span>
                          <div className="flex items-center gap-2">
                            <a 
                              href={scanResult.url_fuente} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded border shadow-sm"
                            >
                              <Link2 size={12}/> Ver Fuente Original
                            </a>
                            <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-mono border border-green-200">
                              {scanResult.matches_encontrados} hits
                            </span>
                          </div>
                        </div>
                      </div>
                   </div>

                   <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
                      <button onClick={() => setScanTarget(null)} className="px-4 py-2 text-sm font-medium hover:bg-muted border rounded-md">
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
