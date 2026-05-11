import { useState, useEffect } from 'react';
import api from '../services/api';

const PuestosClave = () => {
  const [claves, setClaves] = useState<any[]>([]);

  const fetchPuestos = () => {
    api.get('/puestos')
      .then(res => {
        // Ordenar: primero los claves, luego los demás alfabéticamente
        const sorted = res.data.sort((a: any, b: any) => {
           if (a.es_puesto_clave && !b.es_puesto_clave) return -1;
           if (!a.es_puesto_clave && b.es_puesto_clave) return 1;
           return a.nombre.localeCompare(b.nombre);
        });
        setClaves(sorted);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchPuestos();
  }, []);

  const toggleClave = async (id: string, currentValue: boolean) => {
    try {
      await api.put(`/puestos/${id}/clave`, { es_puesto_clave: !currentValue });
      fetchPuestos();
    } catch (error) {
      console.error("Error al alternar puesto clave", error);
      alert("Error de conexión al cambiar el estado.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Puestos Clave / Anclas</h1>
          <p className="text-sm text-muted-foreground mt-1">Selección metodológica LGCI.</p>
        </div>
        <div className="text-right">
           <p className="text-xs uppercase font-semibold text-muted-foreground mb-0.5">Cuota de control</p>
           <div className="font-semibold text-lg"><span className="text-foreground">{claves.filter(c => c.es_puesto_clave).length}</span> / {claves.length} cat.</div>
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="px-4 py-3 font-medium text-muted-foreground w-12 text-center">Sel.</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Categoría Ocupacional</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Área</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Justificación Técnica</th>
              </tr>
            </thead>
            <tbody>
              {claves.map(c => (
                <tr key={c.id} className={`border-b ${c.es_puesto_clave ? 'bg-primary/5' : 'bg-background hover:bg-muted/10'} transition-colors`}>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={c.es_puesto_clave} 
                      onChange={() => toggleClave(c.id, c.es_puesto_clave)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary" 
                    />
                  </td>
                  <td className={`px-4 py-3 font-bold ${c.es_puesto_clave ? 'text-foreground' : 'text-muted-foreground'}`}>{c.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.area}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.descripcion_funciones?.substring(0, 50)}...</td>
                </tr>
              ))}
              {claves.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No hay puestos registrados en la base de datos. Vaya a "Fichas" para crear uno.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PuestosClave;
