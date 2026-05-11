import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, MoreVertical, Briefcase, FileText, CheckCircle, Clock, X, Trash2, Target, Loader2, BookOpen, Upload, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { supabase, getDepartamentos, getCargoDetails, getDepartmentByCargo } from '../services/supabase';

const FichasPuestos: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'puestos' | 'manual'>('puestos');
    const [puestos, setPuestos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [manualPositions, setManualPositions] = useState<any[]>([]);
    const [allDepartments, setAllDepartments] = useState<any[]>([]);
    const [isMapping, setIsMapping] = useState(false);
    
    // Manual import state
    const [manualFile, setManualFile] = useState<File | null>(null);
    const [manualLoading, setManualLoading] = useState(false);
    const [manualPreview, setManualPreview] = useState<any>(null);
    const [manualError, setManualError] = useState<string | null>(null);
    const [manualSuccess, setManualSuccess] = useState<string | null>(null);
    const [catalogoVigente, setCatalogoVigente] = useState<any>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        area: '',
        reporta_a: '',
        descripcion_funciones: '',
        educacion_requerida: '',
        experiencia_requerida: '',
        estrato: '',
        es_puesto_clave: false
    });

    useEffect(() => {
        fetchPuestos();
        fetchManualData();
        fetchCatalogoVigente();
    }, []);

    const fetchCatalogoVigente = useCallback(async () => {
        try {
            const res = await api.get('/manual/vigente');
            setCatalogoVigente(res.data);
        } catch (e) {
            console.error('Error fetching catalogo:', e);
        }
    }, []);

    const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            const ext = selected.name.toLowerCase().split('.').pop();
            if (ext === 'pdf' || ext === 'docx') {
                setManualFile(selected);
                setManualError(null);
                setManualPreview(null);
                setManualSuccess(null);
            } else {
                setManualError('Formato no válido. Use PDF o DOCX.');
            }
        }
    };

    const handleManualUpload = async () => {
        if (!manualFile) return;
        setManualLoading(true);
        setManualError(null);
        try {
            const formData = new FormData();
            formData.append('archivo', manualFile);
            const res = await api.post('/manual/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setManualPreview(res.data);
            if (res.data.saved) {
                setManualSuccess(res.data.message);
                fetchManualData(); // Refrescar dropdown con los datos importados
                fetchCatalogoVigente();
            }
        } catch (e: any) {
            setManualError(e.response?.data?.error || 'Error al procesar el archivo');
        } finally {
            setManualLoading(false);
        }
    };

    const handleManualConfirmar = async () => {
        setManualLoading(true);
        setManualError(null);
        try {
            const res = await api.post('/manual/confirmar');
            setManualSuccess(res.data.message);
            setManualPreview(null);
            setManualFile(null);
            fetchCatalogoVigente();
        } catch (e: any) {
            setManualError(e.response?.data?.error || 'Error al confirmar importación');
        } finally {
            setManualLoading(false);
        }
    };

    const handleManualReset = () => {
        setManualFile(null);
        setManualPreview(null);
        setManualError(null);
        setManualSuccess(null);
    };

    const fetchManualData = async () => {
        try {
            // 1. Intentar cargar desde Supabase (Catálogo Oficial)
            const { data: supabasePositions } = await supabase
                .from('v_catalogo_puestos')
                .select('*')
                .order('cargo', { ascending: true });

            let loadedPositions: any[] = [];

            if (supabasePositions && supabasePositions.length > 0) {
                loadedPositions = supabasePositions.map((p: any) => ({
                    id: p.cargo_id.toString(),
                    cargo: p.cargo,
                    clase: p.clase,
                    fuente: 'supabase'
                }));
                console.log(`Cargados ${loadedPositions.length} puestos desde Supabase`);
            } else {
                // 2. FALLBACK: Cargar desde PDF Local si Supabase está vacío
                console.warn('Supabase sin datos, cargando desde PDF local con filtros de limpieza...');
                try {
                    const res = await api.get('/manual/vigente');
                    const localData = res.data?.catalogo || [];
                    
                    // Filtro estricto para evitar la "suciedad" en el dropdown
                    loadedPositions = localData
                        .filter((p: any) => {
                            const n = p.nombre.toLowerCase();
                            const esBasura = n.length > 70 || 
                                             n.length < 3 ||
                                             /^(acta|art[ií]culo|sesi[oó]n|p[aá]gina|celebrada|mediante)/i.test(n) ||
                                             /(\d{2,}\/\d{2,}\/\d{4})/.test(n); // Fechas
                            return !esBasura;
                        })
                        .map((p: any) => ({
                            id: p.id.toString(),
                            cargo: p.nombre,
                            clase: p.clase,
                            fuente: 'local',
                            funciones: p.funciones,
                            requisitos_academicos: p.requisitos_academicos,
                            requisitos_experiencia: p.requisitos_experiencia,
                            estrato: p.estrato,
                            area: p.area
                        }));
                    console.log(`Cargados ${loadedPositions.length} puestos desde PDF (limpios)`);
                } catch (err) {
                    console.error('Error en fallback local:', err);
                }
            }

            setManualPositions(loadedPositions);

            // Cargar departamentos para el mapeo
            const depts = await getDepartamentos();
            setAllDepartments(depts);
        } catch (error) {
            console.error('Error general en carga de catálogo:', error);
        }
    };

    const fetchPuestos = async () => {
        setLoading(true);
        try {
            const res = await api.get('/puestos');
            setPuestos(res.data);
        } catch (error) {
            console.error('Error fetching puestos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSelection = async (selectionId: string) => {
        if (!selectionId) return;
        setIsMapping(true);
        try {
            const selectedItem = manualPositions.find(p => p.id?.toString() === selectionId);
            if (!selectedItem) return;

            let baseData = {
                nombre: selectedItem.cargo,
                area: '',
                funciones: '',
                educacion: '',
                experiencia: '',
                estrato: selectedItem.clase || ''
            };
            let areaCode = '';

            // 1. Obtener datos base (Prioridad Supabase si existe, sino local)
            if (selectedItem.fuente === 'supabase') {
                const details = await getCargoDetails(selectionId);
                baseData.funciones = details.funciones_detalladas || '';
                baseData.educacion = details.requisitos_educacion || '';
                baseData.experiencia = details.requisitos_experiencia || '';
                baseData.estrato = details.clase || '';
                areaCode = await getDepartmentByCargo(details.cargo);
            } else {
                // Datos directos del PDF local
                baseData.estrato = selectedItem.estrato || baseData.estrato;
                baseData.educacion = selectedItem.requisitos_academicos || '';
                baseData.experiencia = selectedItem.requisitos_experiencia || '';
                areaCode = selectedItem.area || '';
                try {
                    const arr = JSON.parse(selectedItem.funciones);
                    baseData.funciones = Array.isArray(arr) 
                        ? arr.filter((f: string) => f && f.trim().length > 0).map((f: string) => `• ${f.trim()}`).join('\n\n') 
                        : selectedItem.funciones;
                } catch {
                    baseData.funciones = selectedItem.funciones || '';
                }
            }

            // 2. ENRIQUECIMIENTO: Intentar siempre buscar el homólogo en el PDF para funciones específicas
            try {
                const res = await api.get('/manual/vigente');
                const catalogoLocal = res.data?.catalogo || [];
                const clean = (s: string) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
                const target = clean(baseData.nombre);

                const pdfData = catalogoLocal.find((p: any) => 
                    clean(p.nombre) === target || 
                    (p.cargo_contenido && clean(p.cargo_contenido) === target) ||
                    target.includes(clean(p.nombre)) ||
                    clean(p.nombre).includes(target)
                );

                if (pdfData) {
                    if (pdfData.area) areaCode = pdfData.area;
                    if (pdfData.requisitos_academicos) baseData.educacion = pdfData.requisitos_academicos;
                    if (pdfData.requisitos_experiencia) baseData.experiencia = pdfData.requisitos_experiencia;
                    
                    try {
                        const arr = JSON.parse(pdfData.funciones);
                        if (Array.isArray(arr) && arr.length > 0) {
                            baseData.funciones = arr
                                .filter((f: string) => f && f.trim().length > 0)
                                .map((f: string) => `• ${f.trim()}`)
                                .join('\n'); // Un solo salto para mayor orden
                        }
                    } catch {
                        if (pdfData.funciones) baseData.funciones = pdfData.funciones;
                    }
                }
            } catch (err) { }

            // 3. Mapear código de área a nombre de departamento (con segunda oportunidad)
            if (areaCode) {
                const dept = allDepartments.find(d => d.codigo === areaCode);
                if (dept) {
                    baseData.area = dept.nombre;
                }
            }

            // Si el área sigue vacía, intentar heurística de palabras clave
            if (!baseData.area) {
                const heuristicCode = await getDepartmentByCargo(baseData.nombre);
                if (heuristicCode) {
                    const dept = allDepartments.find(d => d.codigo === heuristicCode);
                    if (dept) baseData.area = dept.nombre;
                }
            }

            setFormData({
                ...formData,
                nombre: baseData.nombre,
                area: baseData.area,
                descripcion_funciones: baseData.funciones,
                educacion_requerida: baseData.educacion,
                experiencia_requerida: baseData.experiencia,
                estrato: baseData.estrato
            });

        } catch (error) {
            console.error('Error en Motor de Vinculación:', error);
        } finally {
            setIsMapping(false);
        }
    };

    const handleCreate = async (e?: React.FormEvent | React.MouseEvent) => {
        e?.preventDefault();
        try {
            await api.post('/puestos', formData);
            setShowModal(false);
            setFormData({
                nombre: '', area: '', reporta_a: '', descripcion_funciones: '',
                educacion_requerida: '', experiencia_requerida: '', estrato: '', es_puesto_clave: false
            });
            fetchPuestos();
        } catch (error) {
            alert('Error al crear el puesto');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Está seguro de eliminar esta ficha? Se realizará un borrado lógico auditable.')) return;
        try {
            await api.delete(`/puestos/${id}`);
            fetchPuestos();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const getStatusBadge = (estado: string) => {
        const styles: any = {
            'borrador': 'bg-slate-100 text-slate-600 border-slate-200',
            'evaluado': 'bg-blue-50 text-blue-600 border-blue-200',
            'aprobado': 'bg-green-50 text-green-600 border-green-200',
            'eliminado': 'bg-red-50 text-red-600 border-red-200'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${styles[estado] || styles.borrador}`}>
                {estado}
            </span>
        );
    };

    const filteredPuestos = puestos.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Fichas de Puestos</h1>
                    <p className="text-sm text-muted-foreground">Administración del catálogo de cargos institucionales</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                    <Plus size={18} /> Nuevo Puesto
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('puestos')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        activeTab === 'puestos' 
                            ? 'bg-background text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Briefcase size={16} /> Puestos
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        activeTab === 'manual' 
                            ? 'bg-background text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <BookOpen size={16} /> Manual MSC
                </button>
            </div>

            {activeTab === 'manual' && (
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
                                        onChange={handleManualFileChange} 
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
                                        onClick={handleManualUpload}
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
                                    onClick={handleManualReset}
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
                                            <th className="text-left p-3 font-medium text-muted-foreground">Estrato</th>
                                            <th className="text-center p-3 font-medium text-muted-foreground">Cargos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manualPreview.preview.clases_preview.map((clase: any, idx: number) => (
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
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleManualReset}
                                    className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleManualConfirmar}
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
            )}

            {activeTab === 'puestos' && (
            <>
            <div className="flex gap-4 items-center bg-card p-3 rounded-xl border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o área..." 
                        className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="p-2 border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                    <Filter size={18} />
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center text-muted-foreground animate-pulse font-medium">Actualizando catálogo...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPuestos.map((puesto) => (
                        <div key={puesto.id} className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                            {puesto.es_puesto_clave && (
                                <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase flex items-center gap-1">
                                    <Target size={10} /> Puesto Clave
                                </div>
                            )}
                            
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Briefcase size={24} />
                                </div>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => handleDelete(puesto.id)}
                                        className="text-slate-300 hover:text-destructive p-2 rounded-lg transition-colors"
                                        title="Eliminar Puesto"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg leading-tight">{puesto.nombre}</h3>
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <FileText size={12} /> {puesto.area}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                {getStatusBadge(puesto.estado)}
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                                    <Clock size={12} /> {new Date(puesto.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}



            {filteredPuestos.length === 0 && !loading && (
                <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-slate-50/30">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Briefcase size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">No se encontraron puestos con esos criterios.</p>
                </div>
            )}
            </>)}

            {/* Modal de Nuevo Puesto */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-background border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Nueva Ficha de Puesto</h2>
                            <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
                                <label className="text-[10px] font-bold uppercase text-primary block mb-2">Seleccionar del Manual Institucional</label>
                                <div className="relative">
                                    <select 
                                        className="w-full bg-background border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                        onChange={(e) => handleManualSelection(e.target.value)}
                                        disabled={isMapping}
                                    >
                                        <option value="">-- Buscar puesto en el catálogo oficial --</option>
                                        {manualPositions.map((p: any) => (
                                            <option key={p.id} value={p.id}>
                                                {p.cargo}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                        {isMapping ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 italic">Esto completará automáticamente el área, funciones y requisitos.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Puesto</label>
                                    <input required className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                        value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Área / Departamento</label>
                                    <input required className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                        value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Estrato (Técnico/Profesional)</label>
                                    <input className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                        value={formData.estrato} onChange={e => setFormData({...formData, estrato: e.target.value})} 
                                        placeholder="Ej: Técnico 1, Profesional 3" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Reporta a (Cargo)</label>
                                    <input className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                        value={formData.reporta_a} onChange={e => setFormData({...formData, reporta_a: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Descripción de Funciones</label>
                                <textarea 
                                    required 
                                    rows={10} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed font-medium text-slate-700" 
                                    style={{ whiteSpace: 'pre-wrap' }}
                                    value={formData.descripcion_funciones} 
                                    onChange={e => setFormData({...formData, descripcion_funciones: e.target.value})} 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Educación Requerida</label>
                                    <input className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                        value={formData.educacion_requerida} onChange={e => setFormData({...formData, educacion_requerida: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Experiencia Requerida</label>
                                    <input className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                        value={formData.experiencia_requerida} onChange={e => setFormData({...formData, experiencia_requerida: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="is_clave" className="w-4 h-4 text-primary rounded" 
                                    checked={formData.es_puesto_clave} onChange={e => setFormData({...formData, es_puesto_clave: e.target.checked})} />
                                <label htmlFor="is_clave" className="text-sm font-semibold text-foreground">Marcar como Puesto Clave (Benchmark)</label>
                            </div>
                        </form>
                        <div className="p-6 border-t bg-slate-50/50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Cancelar</button>
                            <button onClick={handleCreate} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">Crear Puesto</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default FichasPuestos;
