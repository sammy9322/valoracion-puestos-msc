import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Briefcase, BookOpen, MoreVertical, FileText, CheckCircle, Check, Clock, X, Trash2, Target, Loader2, Upload, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { supabase, getDepartamentos, getCargoDetails, getCargosPuesto } from '../services/supabase';
import { EXCLUDED_POSITIONS } from '../config/anomalies';
import PuestoCard from '../components/PuestoCard';
import PuestoForm from '../components/PuestoForm';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import AnomaliesModal from '../components/AnomaliesModal';
import ManualImportTab from '../components/ManualImportTab';

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
                fetchManualData();
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

            merged.sort((a, b) => (a.cargo || '').localeCompare(b.cargo || '', 'es'));

            console.log(`Catálogo vinculado: ${merged.length} puestos totales. (Excluidos: ${excludedIds.length})`);
            setManualPositions(merged);

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
                <ManualImportTab
                    catalogoVigente={catalogoVigente}
                    manualFile={manualFile}
                    manualPreview={manualPreview}
                    manualLoading={manualLoading}
                    manualError={manualError}
                    manualSuccess={manualSuccess}
                    onFileChange={handleManualFileChange}
                    onUpload={handleManualUpload}
                    onConfirmar={handleManualConfirmar}
                    onReset={handleManualReset}
                />
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
                        <PuestoCard key={puesto.id} puesto={puesto} onDelete={handleDelete} />
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

            <PuestoForm
                showModal={showModal}
                formData={formData}
                manualPositions={manualPositions}
                allDepartments={allDepartments}
                isMapping={isMapping}
                onClose={() => setShowModal(false)}
                onFormDataChange={setFormData}
                onSubmit={handleCreate}
                onManualSelection={handleManualSelection}
                onShowAnomalies={() => setShowAnomaliesModal(true)}
            />

            <DeleteConfirmModal
                puestoToDelete={puestoToDelete}
                onCancel={() => setPuestoToDelete(null)}
                onConfirm={executeDelete}
            />

            <AnomaliesModal
                showAnomaliesModal={showAnomaliesModal}
                onClose={() => setShowAnomaliesModal(false)}
            />
        </div>
    );
};

export default FichasPuestos;
