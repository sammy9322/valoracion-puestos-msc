import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, MoreVertical, Briefcase, FileText, CheckCircle, Check, Clock, X, Trash2, Target, Loader2, BookOpen, Upload, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { supabase, getDepartamentos, getCargoDetails, getCargosPuesto } from '../services/supabase';
import { EXCLUDED_POSITIONS } from '../config/anomalies';

const FichasPuestos: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'puestos' | 'manual'>('puestos');
    const [puestos, setPuestos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [manualPositions, setManualPositions] = useState<any[]>([]);
    const [allDepartments, setAllDepartments] = useState<any[]>([]);
    const [isMapping, setIsMapping] = useState(false);
    const [puestoToDelete, setPuestoToDelete] = useState<string | null>(null);
    const [showAnomaliesModal, setShowAnomaliesModal] = useState(false);
    
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

            const excludedIds = EXCLUDED_POSITIONS.map(p => p.id);

            const merged: any[] = (supabasePositions || [])
                .map((p: any) => ({
                    id: p.cargo_id.toString(),
                    cargo: p.cargo,
                    clase: p.clase,
                    fuente: 'supabase',
                    vinculado: true,
                    nombre_oficial: p.cargo
                }))
                .filter((p: any) => !excludedIds.includes(p.id));

            // Ordenar alfabéticamente
            merged.sort((a, b) => (a.cargo || '').localeCompare(b.cargo || '', 'es'));
            
            console.log(`Catálogo vinculado: ${merged.length} puestos totales. (Excluidos: ${excludedIds.length})`);
            setManualPositions(merged);

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
                area: selectedItem.area || '',
                funciones: '',
                educacion: '',
                experiencia: '',
                estrato: ''
            };

            // Extraer 100% desde Supabase
            const supabaseId = selectedItem.id;
            
            if (supabaseId) {
                try {
                    const details = await getCargoDetails(supabaseId);
                    if (details) {
                        const partes = [];
                        if (details.naturaleza) partes.push(details.naturaleza);
                        if (details.funciones_detalladas) partes.push(details.funciones_detalladas);
                        
                        baseData.funciones = partes.join('\n\n').trim();
                        baseData.educacion = details.requisitos_educacion || '';
                        baseData.experiencia = details.requisitos_experiencia || '';
                        baseData.estrato = details.estrato || '';
                    }
                } catch (err) {
                    console.warn('Detalles de Supabase no disponibles para:', supabaseId);
                }
            }
            
            setFormData(prev => ({
                ...prev,
                nombre: baseData.nombre,
                area: baseData.area,
                descripcion_funciones: baseData.funciones,
                educacion_requerida: baseData.educacion,
                experiencia_requerida: baseData.experiencia,
                estrato: baseData.estrato
            }));

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

    const handleDelete = (id: string) => {
        setPuestoToDelete(id);
    };

    const executeDelete = async () => {
        if (!puestoToDelete) return;
        try {
            await api.delete(`/puestos/${puestoToDelete}`);
            setPuestoToDelete(null);
            fetchPuestos();
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
            console.error('Error detallado al eliminar:', error.response?.data || error);
            alert(`Error al eliminar: ${errorMsg}`);
            setPuestoToDelete(null);
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

    const filteredPuestos = Array.isArray(puestos) ? puestos.filter(p => 
        (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.area || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

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
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(puesto.id);
                                        }}
                                        className="text-slate-300 hover:text-destructive p-2 rounded-lg transition-colors relative z-20 cursor-pointer"
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
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(puesto.estado)}
                                    {puesto.estado !== 'aprobado' && (
                                        <a 
                                            href={`/evaluaciones?puesto_id=${puesto.id}`}
                                            className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary hover:text-white transition-all font-bold uppercase"
                                        >
                                            Evaluar
                                        </a>
                                    )}
                                </div>
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
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold uppercase text-primary block">Seleccionar del Manual Institucional</label>
                                    {EXCLUDED_POSITIONS.length > 0 && (
                                        <button 
                                            type="button"
                                            onClick={() => setShowAnomaliesModal(true)}
                                            className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full hover:bg-amber-200 transition-colors flex items-center gap-1"
                                        >
                                            <AlertCircle size={10} /> Ver Anomalías ({EXCLUDED_POSITIONS.length})
                                        </button>
                                    )}
                                </div>
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
                                    <select 
                                        required 
                                        className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none" 
                                        value={formData.area} 
                                        onChange={e => setFormData({...formData, area: e.target.value})}
                                    >
                                        <option value="">-- Seleccione un área --</option>
                                        {allDepartments.map((dept: any) => (
                                            <option key={dept.codigo} value={dept.nombre}>
                                                {dept.codigo} - {dept.nombre}
                                            </option>
                                        ))}
                                    </select>
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
                                    className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
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

            {/* Modal de Confirmación de Borrado */}
            {puestoToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-background border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">¿Eliminar Ficha?</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Esta acción realizará un borrado lógico auditable de la ficha seleccionada. ¿Está seguro de proceder?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setPuestoToDelete(null)}
                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={executeDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Registro de Anomalías */}
            {showAnomaliesModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-background border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b bg-amber-50/50">
                            <div className="flex items-center gap-2 text-amber-700">
                                <AlertCircle size={20} />
                                <h2 className="text-lg font-bold">Registro de Cuarentena (Anomalías)</h2>
                            </div>
                            <button onClick={() => setShowAnomaliesModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            <p className="text-sm text-slate-600 mb-4">
                                Los siguientes puestos han sido excluidos automáticamente del catálogo para proteger la integridad de los datos, ya que presentan anomalías en la base de datos externa.
                            </p>
                            {EXCLUDED_POSITIONS.map(pos => (
                                <div key={pos.id} className="bg-slate-50 border rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800">{pos.nombre}</h4>
                                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">ID: {pos.id}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500 mb-2">Clase: {pos.clase}</p>
                                    <div className="bg-amber-100/50 text-amber-800 text-xs p-3 rounded-lg border border-amber-200">
                                        <strong>Razón:</strong> {pos.razon}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end">
                            <button onClick={() => setShowAnomaliesModal(false)} className="px-6 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-bold transition-colors">
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FichasPuestos;
