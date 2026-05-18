import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    puestosTotal: 0,
    puestosEvaluados: 0,
    puestosClave: 0,
    vpActualizado: false,
    vpValor: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [puestosRes, vpRes] = await Promise.all([
          api.get('/puestos'),
          api.get('/calculos/vp').catch(() => ({ data: null }))
        ]);

        const puestos = Array.isArray(puestosRes.data) ? puestosRes.data : [];
        const evaluados = puestos.filter((p: any) => p.estado === 'evaluado').length;
        const claves = puestos.filter((p: any) => p.es_puesto_clave).length;

        setStats({
          puestosTotal: puestos.length,
          puestosEvaluados: evaluados,
          puestosClave: claves,
          vpActualizado: vpRes.data !== null,
          vpValor: vpRes.data?.vpExact || 0
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const sevriChecks = {
    puestosClaveEvaluados: stats.puestosClave > 0 && stats.puestosEvaluados >= stats.puestosClave,
    vpActualizado: stats.vpActualizado
  };

  if (loading) return <div className="p-10 text-center">Cargando dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Resumen Gerencial</h1>
        <p className="text-sm text-muted-foreground">Estadísticas de la plataforma según el Manual MSC 2024</p>
      </div>

      {/* Checklist SEVRI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${sevriChecks.puestosClaveEvaluados ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          {sevriChecks.puestosClaveEvaluados ? <CheckCircle className="text-green-600" size={20} /> : <AlertTriangle className="text-orange-500" size={20} />}
          <div>
            <p className="text-sm font-semibold">Puestos Clave Evaluados</p>
            <p className="text-xs text-muted-foreground">{stats.puestosClave} de {stats.puestosClave} evaluados</p>
          </div>
        </div>
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${sevriChecks.vpActualizado ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          {sevriChecks.vpActualizado ? <CheckCircle className="text-green-600" size={20} /> : <AlertTriangle className="text-orange-500" size={20} />}
          <div>
            <p className="text-sm font-semibold">Valor del Punto Actualizado</p>
            <p className="text-xs text-muted-foreground">{stats.vpActualizado ? `VP: ₡${stats.vpValor.toFixed(2)}` : 'Sin VP registrado'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg bg-card border shadow-sm flex flex-col">
          <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-2">Puestos Registrados</h3>
          <p className="text-3xl font-semibold text-foreground">{stats.puestosTotal}</p>
          <p className="text-xs text-muted-foreground mt-auto pt-4 flex items-center gap-1">En base de datos</p>
        </div>

        <div className="p-6 rounded-lg bg-card border shadow-sm flex flex-col">
          <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-2">Evaluados</h3>
          <p className="text-3xl font-semibold text-foreground">{stats.puestosEvaluados}</p>
          <p className="text-xs text-muted-foreground mt-auto pt-4 flex items-center gap-1">Con dictamen técnico</p>
        </div>

        <div className="p-6 rounded-lg bg-card border shadow-sm border-l-4 border-l-destructive flex flex-col">
          <h3 className="font-semibold text-destructive text-xs uppercase tracking-wider mb-2">Pendientes</h3>
          <p className="text-3xl font-semibold text-foreground">{stats.puestosTotal - stats.puestosEvaluados}</p>
          <p className="text-xs text-muted-foreground mt-auto pt-4 flex items-center gap-1">Requieren evaluación</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
