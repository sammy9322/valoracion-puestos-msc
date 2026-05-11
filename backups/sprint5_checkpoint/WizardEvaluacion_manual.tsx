import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Save, AlertTriangle, FileText } from 'lucide-react';
import api from '../services/api';

const RANGOS_MSC = {
  dificultad:         { 1: [0, 25], 2: [30, 50], 3: [55, 75], 4: [80, 100], 5: [105, 130], 6: [135, 150] },
  supervision:        { 1: [5, 25], 2: [30, 50], 3: [55, 75], 4: [80, 100], 5: [105, 125], 6: [130, 150] },
  responsabilidad:    { 1: [0, 25], 2: [30, 50], 3: [55, 75], 4: [80, 100], 5: [105, 150], 6: [160, 200] },
  condiciones:        { 1: [5, 30], 2: [35, 60], 3: [65, 90], 4: [95, 120], 5: [125, 150] }, 
  consecuencia_error: { 1: [0, 25], 2: [30, 50], 3: [55, 75], 4: [80, 100], 5: [105, 125], 6: [130, 150] },
  requisitos:         { 1: [5, 20], 2: [25, 45], 3: [50, 75], 4: [80, 100], 5: [105, 125], 6: [130, 150] }
};

const FACTORES = [
  { key: 'dificultad', title: '1. Dificultad', max: 150, maxGrado: 6, desc: 'Trabajo lógico y analítico requerido.' },
  { key: 'supervision', title: '2. Supervisión', max: 150, maxGrado: 6, desc: 'Supervisión recibida y ejercida.' },
  { key: 'responsabilidad', title: '3. Responsabilidad', max: 200, maxGrado: 6, desc: 'Por funciones, materiales y valores.' },
  { key: 'condiciones', title: '4. Condiciones', max: 150, maxGrado: 5, desc: 'Ambiente térmico, esfuerzo y riesgo.' },
  { key: 'consecuencia_error', title: '5. Error', max: 150, maxGrado: 6, desc: 'Impacto de omisiones e inexactitudes.' },
  { key: 'requisitos', title: '6. Requisitos', max: 150, maxGrado: 6, desc: 'Educación, experiencia y habilidades.' },
  { key: 'resumen', title: '7. Resumen', max: 0, maxGrado: 0, desc: 'Revisión final' }
];

const WizardEvaluacion = () => {
  const [pasoActual, setPasoActual] = useState(0);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [puestoIdSeleccionado, setPuestoIdSeleccionado] = useState('');
  
  const [valores, setValores] = useState<Record<string, { grado: number, puntos: number, justificacion: string }>>({
    dificultad: { grado: 1, puntos: 0, justificacion: '' },
    supervision: { grado: 1, puntos: 0, justificacion: '' },
    responsabilidad: { grado: 1, puntos: 0, justificacion: '' },
    condiciones: { grado: 1, puntos: 0, justificacion: '' },
    consecuencia_error: { grado: 1, puntos: 0, justificacion: '' },
    requisitos: { grado: 1, puntos: 0, justificacion: '' }
  });

  useEffect(() => {
    // Cargar puestos (mostramos todos para que el usuario vea los sembrados en el demo)
    api.get('/puestos')
      .then(res => setPuestos(res.data))
      .catch(console.error);
  }, []);

  const handleChange = (factorKey: string, field: string, val: any) => {
    setValores(prev => ({
      ...prev,
      [factorKey]: { ...prev[factorKey], [field]: val }
    }));
  };

  const totalPuntos = useMemo(() => {
    return Object.values(valores).reduce((acc, curr) => acc + (Number(curr.puntos) || 0), 0);
  }, [valores]);

  const esPasoResumen = pasoActual === FACTORES.length - 1;
  const factorActual = FACTORES[pasoActual];
  const puestoSeleccionado = puestos.find(p => p.id === puestoIdSeleccionado);

  const validateRangoError = () => {
    if (esPasoResumen) return false;
    const factorK = factorActual.key;
    const data = valores[factorK];
    if (!data.grado || !data.puntos) return true;
    
    // @ts-ignore
    const rangoPermitido = RANGOS_MSC[factorK][data.grado];
    if (!rangoPermitido) return true;
    
    return data.puntos < rangoPermitido[0] || data.puntos > rangoPermitido[1];
  };

  const handleSubmit = async () => {
    if (!puestoIdSeleccionado) return alert("Debe seleccionar un puesto primero");
    try {
      const payload = {
        puesto_id: puestoIdSeleccionado,
        puntos_totales: totalPuntos,
        ...valores
      };
      await api.post('/evaluaciones', payload);
      alert('¡Evaluación guardada exitosamente y ligada en la BD!');
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert('Error guardando en BD');
    }
  };

  if (!puestoIdSeleccionado) {
    return (
      <div className="bg-card border rounded-lg p-6 max-w-xl mx-auto mt-10">
        <h2 className="text-lg font-semibold mb-2">Seleccione un Puesto para Evaluar</h2>
        <p className="text-sm text-muted-foreground mb-6">Solo se muestran los puestos en estado borrador listos para metodología de puntos.</p>
        
        {puestos.length === 0 ? (
          <div className="p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-md text-sm">
            No hay puestos disponibles. Ve a la sección "Fichas" y crea un nuevo puesto primero.
          </div>
        ) : (
          <select 
            className="w-full h-10 px-3 text-sm rounded-md border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background"
            value={puestoIdSeleccionado}
            onChange={(e) => setPuestoIdSeleccionado(e.target.value)}
          >
            <option value="">Seleccionar Ficha MSC...</option>
            {puestos.map(p => (
               <option key={p.id} value={p.id}>{p.nombre} - {p.area}</option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-card border rounded-lg shadow-sm p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{puestoSeleccionado?.nombre}</h2>
            <div className="text-sm text-muted-foreground">Ficha ID: {puestoSeleccionado?.id.split('-')[0]} | {puestoSeleccionado?.area}</div>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Puntos</p>
          <div className="text-2xl font-bold text-foreground">
            {totalPuntos} <span className="text-sm text-muted-foreground font-normal">/ 1000</span>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm flex flex-col min-h-[500px]">
        {/* Stepper Navigation */}
        <div className="flex overflow-x-auto border-b bg-muted/30">
          {FACTORES.map((f, i) => (
            <button
              key={f.key}
              onClick={() => setPasoActual(i)}
              className={`flex-1 py-3 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                pasoActual === i 
                  ? 'border-primary text-primary bg-background' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {f.title}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {!esPasoResumen ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
              
              {/* Formular Box */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-foreground">{factorActual.title}</h3>
                  <p className="text-sm text-muted-foreground">{factorActual.desc}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">1. Grado Asignado</label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({length: factorActual.maxGrado}, (_, i) => i + 1).map(g => (
                        <button
                          key={g}
                          onClick={() => handleChange(factorActual.key, 'grado', g)}
                          className={`w-10 h-10 rounded-md text-sm font-semibold transition-colors border ${
                            valores[factorActual.key].grado === g 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'bg-background border-border text-foreground hover:border-primary/50'
                          }`}
                        >
                          {g}°
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">2. Puntuación (Máx {factorActual.max})</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        min="0" max={factorActual.max}
                        value={valores[factorActual.key].puntos || ''}
                        onChange={e => handleChange(factorActual.key, 'puntos', parseInt(e.target.value))}
                        className={`w-32 h-10 px-3 text-base rounded-md border bg-background focus:outline-none focus:ring-1 transition-colors ${validateRangoError() && valores[factorActual.key].puntos > 0 ? 'border-destructive focus:ring-destructive text-destructive' : 'border-border focus:border-primary focus:ring-primary'}`}
                      />
                      {/* @ts-ignore */}
                      <span className="text-xs text-muted-foreground">Rango legal: {RANGOS_MSC[factorActual.key][valores[factorActual.key].grado][0]} - {RANGOS_MSC[factorActual.key][valores[factorActual.key].grado][1]} pts</span>
                    </div>
                    {validateRangoError() && valores[factorActual.key].puntos > 0 && (
                      <div className="text-xs text-destructive mt-2 py-1.5 flex items-center gap-1.5">
                        <AlertTriangle size={14}/> Fuera del límite permitido para el Grado {valores[factorActual.key].grado}°.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">3. Sustento Metodológico <span className="text-destructive">*</span></label>
                    <textarea 
                      rows={3} 
                      value={valores[factorActual.key].justificacion}
                      onChange={e => handleChange(factorActual.key, 'justificacion', e.target.value)}
                      className="w-full p-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-colors" 
                      placeholder="Indique los criterios..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-1">
                <div className="bg-muted/30 border rounded-lg p-4 h-full">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">Manual MSC</h4>
                  <div className="space-y-2">
                    {/* @ts-ignore */}
                    {Object.entries(RANGOS_MSC[factorActual.key]).map(([grado, rango]) => (
                      <div key={grado} className={`p-3 rounded-md border text-sm ${valores[factorActual.key].grado === Number(grado) ? 'bg-background border-primary shadow-sm' : 'bg-transparent border-transparent'}`}>
                        <div className={`flex justify-between font-semibold mb-1 ${valores[factorActual.key].grado === Number(grado) ? 'text-primary' : 'text-foreground'}`}>
                          <span>Grado {grado}°</span>
                          <span>{rango[0]}-{rango[1]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col py-6">
              <div className="mb-6 border-b pb-4">
                <h3 className="text-lg font-semibold text-foreground">Resumen de Puntuación</h3>
                <p className="text-sm text-muted-foreground">Revisión de los 6 factores.</p>
              </div>

              <div className="max-w-md w-full space-y-2">
                {FACTORES.slice(0,6).map((f) => (
                  <div key={f.key} className="flex items-center justify-between p-3 border-b text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-muted-foreground font-mono">{valores[f.key]?.grado}°</span>
                      <span className="font-medium">{f.title.substring(3)}</span>
                    </div>
                    <span className="font-semibold">{valores[f.key]?.puntos || 0}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 pt-6 text-base">
                  <span className="font-bold">TOTAL ASIGNADO</span>
                  <span className="font-bold text-primary">{totalPuntos}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 px-6 border-t bg-muted/20 flex justify-between items-center">
          <button 
            disabled={pasoActual === 0}
            onClick={() => setPasoActual(p => Math.max(0, p - 1))}
            className="flex items-center gap-2 px-4 py-2 border bg-background rounded-md disabled:opacity-50 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ChevronLeft size={16} /> Atrás
          </button>
          
          {!esPasoResumen ? (
            <button 
              onClick={() => setPasoActual(p => Math.min(FACTORES.length - 1, p + 1))}
              disabled={validateRangoError() && valores[factorActual.key].puntos > 0}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
             <button onClick={handleSubmit} className="flex items-center gap-2 px-5 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              <Save size={16} /> Finalizar Documento SEVRI
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WizardEvaluacion;
