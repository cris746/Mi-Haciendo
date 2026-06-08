import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Eye, Edit2, Power, MapPin, History, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PrintAnimalRecord from '../../components/PrintAnimalRecord';
import ConfirmModal from '../../components/ConfirmModal';
import PromptModal from '../../components/PromptModal';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { triggerPrint, cleanupPrint } from '../../utils/printDocument';

const formatMonthsToText = (months) => {
  if (months === null || months === undefined) return '-';
  if (months === 0) return '0 meses';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} mes${m !== 1 ? 'es' : ''}`;
  if (m === 0) return `${y} año${y !== 1 ? 's' : ''}`;
  return `${y} año${y !== 1 ? 's' : ''} y ${m} mes${m !== 1 ? 'es' : ''}`;
};

const formatDateForInput = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toISOString().split('T')[0];
};

function formatDateSafe(dateValue) {
  if (!dateValue) return '';
  const dateString = String(dateValue).split('T')[0];
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

const GenealogyCard = ({ animal, title, color = 'gray' }) => {
  const colors = {
    gray: 'bg-gray-50 border-gray-200 text-gray-500',
    blue: 'bg-blue-50 border-blue-200 text-blue-500',
    pink: 'bg-pink-50 border-pink-200 text-pink-500',
    primary: 'bg-primary-50 border-primary-200 text-primary-600',
  };
  const borderColor = color === 'gray' ? 'border-gray-200' : color === 'blue' ? 'border-blue-300' : color === 'pink' ? 'border-pink-300' : 'border-primary-300';
  
  if (!animal) {
    return (
      <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center h-24">
        <span className="text-xs font-bold text-gray-400 mb-1">{title}</span>
        <span className="text-sm italic text-gray-400">No registrad{title.includes('Madre') || title.includes('Abuela') ? 'a' : 'o'}</span>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border shadow-sm ${borderColor} ${colors[color].split(' ')[0]} h-24 flex flex-col justify-center`}>
      <span className={`text-xs font-bold ${colors[color].split(' ')[2]} block mb-1 uppercase tracking-wider`}>{title}</span>
      <div translate="no" lang="zxx" className="font-bold text-gray-900 truncate" title={animal.nombre}>{animal.nombre}</div>
      <div translate="no" lang="zxx" className="text-gray-500 text-sm font-medium">#{animal.nroArete}</div>
    </div>
  );
};

const Animales = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [animales, setAnimales] = useState([]);
  const [razas, setRazas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para nuevos modales UX
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', variant: 'danger', confirmText: '', onConfirm: () => {} });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', label: '', placeholder: '', confirmText: '', onConfirm: () => {} });
  const [modalLoading, setModalLoading] = useState(false);
  
  const [filtroEstadoAnimal, setFiltroEstadoAnimal] = useState('ACTIVOS');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  // Detail states
  const [animalDetail, setAnimalDetail] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('general');
  const [genealogyData, setGenealogyData] = useState(null);
  const [descendenciaData, setDescendenciaData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState(null);

  // Ubicación
  const [ubicacionMap, setUbicacionMap] = useState({});

  // Historial de movimientos en detalle
  const [movimientosData, setMovimientosData] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // Alimentación
  const [alimentacionData, setAlimentacionData] = useState([]);
  const [loadingAlimentacion, setLoadingAlimentacion] = useState(false);

  // Sanidad (Impresión)
  const [sanidadData, setSanidadData] = useState([]);
  const [loadingSanidad, setLoadingSanidad] = useState(false);
  const [printMode, setPrintMode] = useState(null);

  const initialFormState = {
    nombre: '',
    nroArete: '',
    sexo: 'MACHO',
    peso: '',
    razaId: '',
    categoriaId: '',
    imagen: '',
    origen: 'NACIDO',
    fechaNacimiento: '',
    fechaIngreso: '',
    edadIngresoMeses: '',
    precioCompra: '',
    padreId: '',
    madreId: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    window.addEventListener('afterprint', cleanupPrint);
    return () => {
      window.removeEventListener('afterprint', cleanupPrint);
      cleanupPrint();
    };
  }, []);

  const printAnimalDocument = (mode) => {
    if (!animalDetail) return;
    triggerPrint(() => setPrintMode(mode), {
      selector: '.animal-record-print',
      delay: 400
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAnimales, resRazas, resCat, resUbicaciones] = await Promise.allSettled([
        api.get('/animals'),
        api.get('/animals/razas'),
        api.get('/animals/categorias'),
        api.get('/movimientos/animales-ubicacion')
      ]);

      if (resAnimales.status === 'fulfilled') setAnimales(resAnimales.value.data);
      if (resRazas.status === 'fulfilled') setRazas(resRazas.value.data);
      if (resCat.status === 'fulfilled') setCategorias(resCat.value.data);

      if (resUbicaciones.status === 'fulfilled') {
        const map = {};
        resUbicaciones.value.data.forEach(a => { map[a.id] = a.ubicacionActual; });
        setUbicacionMap(map);
      }

      const razasData = resRazas.status === 'fulfilled' ? resRazas.value.data : [];
      const catData = resCat.status === 'fulfilled' ? resCat.value.data : [];
      if (razasData.length > 0 && catData.length > 0) {
        setFormData(prev => ({
          ...prev,
          razaId: razasData[0].id,
          categoriaId: catData[0].id
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      ...initialFormState,
      razaId: razas[0]?.id || '',
      categoriaId: categorias[0]?.id || ''
    });
    setShowCreateModal(true);
  };

  const openEditModal = (animal) => {
    setSelectedAnimal(animal);
    setFormData({
      nombre: animal.nombre,
      nroArete: animal.nroArete,
      sexo: animal.sexo,
      peso: animal.peso || '',
      razaId: animal.razaId || razas[0]?.id,
      categoriaId: animal.categoriaId || categorias[0]?.id,
      imagen: animal.imagen || '',
      origen: animal.origen || 'NACIDO',
      fechaNacimiento: formatDateForInput(animal.fechaNacimiento),
      fechaIngreso: formatDateForInput(animal.fechaIngreso),
      edadIngresoMeses: animal.edadIngresoMeses ?? '',
      precioCompra: animal.precioCompra !== null && animal.precioCompra !== undefined
        ? String(animal.precioCompra)
        : '',
      padreId: animal.padreId || '',
      madreId: animal.madreId || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = async (id) => {
    setActiveDetailTab('general');
    setGenealogyData(null);
    setDescendenciaData(null);
    setMovimientosData([]);
    setErrorDetail(null);
    setAnimalDetail(null);
    setShowViewModal(true);
    setLoadingDetail(true);
    setLoadingMovimientos(true);
    setLoadingAlimentacion(true);
    setAlimentacionData([]);
    setSanidadData([]);
    setLoadingSanidad(true);
    setPrintMode(null);

    try {
      const results = await Promise.allSettled([
        api.get(`/animals/${id}`),
        api.get(`/animals/${id}/genealogy`),
        api.get(`/animals/${id}/descendencia`),
        api.get(`/movimientos/movimientos/${id}`),
        api.get(`/alimentacion/animal/${id}`),
        api.get(`/tratamientos/animal/${id}`)
      ]);

      if (results[0].status === 'fulfilled') {
        setAnimalDetail(results[0].value.data);
      } else {
        setErrorDetail('Error al cargar la información principal del expediente.');
      }

      if (results[1].status === 'fulfilled') {
        setGenealogyData(results[1].value.data);
      } else {
        setGenealogyData({ error: true });
      }

      if (results[2].status === 'fulfilled') {
        setDescendenciaData(results[2].value.data);
      } else {
        setDescendenciaData({ error: true });
      }

      if (results[3].status === 'fulfilled') {
        setMovimientosData(results[3].value.data);
      }

      if (results[4].status === 'fulfilled') {
        setAlimentacionData(results[4].value.data);
      }

      if (results[5].status === 'fulfilled') {
        setSanidadData(results[5].value.data);
      }
    } catch (error) {
      setErrorDetail('Error inesperado al cargar el expediente.');
    } finally {
      setLoadingDetail(false);
      setLoadingMovimientos(false);
      setLoadingAlimentacion(false);
      setLoadingSanidad(false);
    }
  };

  const handleAnnulAlimentacion = (alimId) => {
    setPromptModal({
      isOpen: true,
      title: 'Anular alimentación',
      message: 'Esta acción revertirá el consumo registrado y ajustará el inventario. Ingrese el motivo de anulación.',
      label: 'Motivo de anulación',
      placeholder: 'Ej: Error de cantidad, registro duplicado...',
      confirmText: 'Anular alimentación',
      variant: 'danger',
      onConfirm: async (motivo) => {
        setModalLoading(true);
        try {
          await api.patch(`/alimentacion/${alimId}/anular`, { motivoAnulacion: motivo });
          // Refrescar solo alimentación
          const res = await api.get(`/alimentacion/animal/${animalDetail.id}`);
          setAlimentacionData(res.data);
          setPromptModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          alert(error.response?.data?.error || 'Error al anular alimentación');
        } finally {
          setModalLoading(false);
        }
      }
    });
  };

  const buildPayload = () => {
    const payload = {
      nombre: formData.nombre,
      nroArete: formData.nroArete,
      sexo: formData.sexo,
      peso: formData.peso ? parseFloat(formData.peso) : null,
      razaId: parseInt(formData.razaId),
      categoriaId: parseInt(formData.categoriaId),
      imagen: formData.imagen || null,
      origen: formData.origen,
      padreId: formData.padreId ? parseInt(formData.padreId) : null,
      madreId: formData.madreId ? parseInt(formData.madreId) : null
    };

    if (formData.origen === 'NACIDO') {
      payload.fechaNacimiento = formData.fechaNacimiento;
      payload.fechaIngreso = null;
      payload.edadIngresoMeses = null;
      payload.precioCompra = null;
    } else if (formData.origen === 'COMPRADO') {
      payload.fechaNacimiento = null;
      payload.fechaIngreso = formData.fechaIngreso || null;
      payload.edadIngresoMeses = formData.edadIngresoMeses !== '' ? parseInt(formData.edadIngresoMeses) : null;
      payload.precioCompra = formData.precioCompra !== '' ? parseFloat(formData.precioCompra) : null;
    }

    return payload;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.padreId && formData.madreId && formData.padreId === formData.madreId) {
      return alert('El padre y la madre no pueden ser el mismo animal.');
    }
    if (formData.origen === 'COMPRADO') {
      const pc = parseFloat(formData.precioCompra);
      if (formData.precioCompra === '' || isNaN(pc) || pc < 0) {
        return alert('El precio de compra es obligatorio para animales COMPRADOS y debe ser mayor o igual a 0.');
      }
    }
    try {
      await api.post('/animals', buildPayload());
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear animal');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (formData.padreId && formData.madreId && formData.padreId === formData.madreId) {
      return alert('El padre y la madre no pueden ser el mismo animal.');
    }
    if (formData.origen === 'COMPRADO') {
      const pc = parseFloat(formData.precioCompra);
      if (formData.precioCompra === '' || isNaN(pc) || pc < 0) {
        return alert('El precio de compra es obligatorio para animales COMPRADOS y debe ser mayor o igual a 0.');
      }
    }
    try {
      await api.put(`/animals/${selectedAnimal.id}`, buildPayload());
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al actualizar animal');
    }
  };

  const handleStatusChange = (id) => {
    const animal = animales.find(a => a.id === id);
    const isActivating = !animal.estado;

    setConfirmModal({
      isOpen: true,
      title: isActivating ? 'Reactivar animal' : 'Desactivar animal',
      message: isActivating 
        ? `¿Seguro que deseas reactivar a ${animal.nombre}? Volverá a estar disponible para operaciones activas.`
        : `¿Seguro que deseas desactivar a ${animal.nombre}? El animal dejará de estar disponible para operaciones activas. Su expediente se conservará para auditoría.`,
      variant: isActivating ? 'success' : 'danger',
      confirmText: isActivating ? 'Reactivar' : 'Desactivar',
      onConfirm: async () => {
        setModalLoading(true);
        try {
          await api.patch(`/animals/${id}/estado`);
          fetchData();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          alert(error.response?.data?.error || 'Error al cambiar estado');
        } finally {
          setModalLoading(false);
        }
      }
    });
  };

  const padresPotenciales = animales.filter(a => {
    const isMacho = a.sexo?.toUpperCase().trim() === 'MACHO';
    const isAlive = a.estado === true || a.vendido === true;
    const isNotSelf = selectedAnimal ? a.id !== selectedAnimal.id : true;
    return isMacho && isAlive && isNotSelf;
  });

  const madresPotenciales = animales.filter(a => {
    const isHembra = a.sexo?.toUpperCase().trim() === 'HEMBRA';
    const isAlive = a.estado === true || a.vendido === true;
    const isNotSelf = selectedAnimal ? a.id !== selectedAnimal.id : true;
    return isHembra && isAlive && isNotSelf;
  });

  const animalesFiltrados = animales.filter(a => {
    if (filtroEstadoAnimal === 'TODOS') return true;
    if (filtroEstadoAnimal === 'ACTIVOS') return a.estado === true && !a.vendido;
    if (filtroEstadoAnimal === 'VENDIDOS') return a.vendido === true;
    if (filtroEstadoAnimal === 'INACTIVOS') return a.estado === false && !a.vendido;
    return true;
  });

  const renderFormFields = () => (
    <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
      {/* SECCIÓN 1: Identificación */}
      <h4 className="font-bold text-gray-700 border-b pb-1">Identificación</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Número de Arete</label>
          <input className="input" required value={formData.nroArete} onChange={e => setFormData({...formData, nroArete: e.target.value})} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre</label>
          <input className="input" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Sexo</label>
          <select className="input" value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}>
            <option value="MACHO">Macho</option>
            <option value="HEMBRA">Hembra</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Peso (kg)</label>
          <input type="number" step="0.01" min="0" className="input" value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Raza</label>
          <select className="input" required value={formData.razaId} onChange={e => setFormData({...formData, razaId: e.target.value})}>
            {razas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Categoría</label>
          <select className="input" required value={formData.categoriaId} onChange={e => setFormData({...formData, categoriaId: e.target.value})}>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* SECCIÓN 2: Foto */}
      <h4 className="font-bold text-gray-700 border-b pb-1 mt-6">Foto</h4>
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-500 mb-1 block">URL de la Imagen</label>
          <input type="text" className="input w-full" placeholder="https://..." value={formData.imagen} onChange={e => setFormData({...formData, imagen: e.target.value})} />
        </div>
        {formData.imagen && (
          <div className="w-16 h-16 rounded-lg border overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
            <img src={formData.imagen} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        )}
      </div>

      {/* SECCIÓN 3: Biografía */}
      <h4 className="font-bold text-gray-700 border-b pb-1 mt-6">Biografía y Origen</h4>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Origen</label>
          <select className="input" required value={formData.origen} onChange={e => setFormData({...formData, origen: e.target.value})}>
            <option value="NACIDO">Nacido en hacienda</option>
            <option value="COMPRADO">Comprado</option>
          </select>
        </div>
      </div>
      
      {formData.origen === 'NACIDO' && (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha de Nacimiento</label>
            <input type="date" max={new Date().toISOString().split('T')[0]} className="input" required value={formData.fechaNacimiento} onChange={e => setFormData({...formData, fechaNacimiento: e.target.value})} />
          </div>
        </div>
      )}

      {formData.origen === 'COMPRADO' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha de Ingreso</label>
              <input type="date" max={new Date().toISOString().split('T')[0]} className="input" required value={formData.fechaIngreso} onChange={e => setFormData({...formData, fechaIngreso: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Edad al Ingreso (Meses)</label>
              <input type="number" min="0" className="input" required value={formData.edadIngresoMeses} onChange={e => setFormData({...formData, edadIngresoMeses: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">
              Precio de Compra (Bs.) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Bs.</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input pl-12"
                required
                placeholder="0.00"
                value={formData.precioCompra}
                onChange={e => setFormData({...formData, precioCompra: e.target.value})}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Este valor se usará para calcular la ganancia al momento de la venta.</p>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: Genealogía */}
      <h4 className="font-bold text-gray-700 border-b pb-1 mt-6">Genealogía</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Padre</label>
          <select className="input" value={formData.padreId} onChange={e => setFormData({...formData, padreId: e.target.value})}>
            <option value="">Sin padre registrado</option>
            {padresPotenciales.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.nroArete}){p.vendido ? ' (Vendido)' : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Madre</label>
          <select className="input" value={formData.madreId} onChange={e => setFormData({...formData, madreId: e.target.value})}>
            <option value="">Sin madre registrada</option>
            {madresPotenciales.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.nroArete}){m.vendido ? ' (Vendido)' : ''}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner text="Cargando animales..." />;

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Control de Animales</h2>
          <p className="text-gray-500">Expediente digital y gestión de ganado</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-40" value={filtroEstadoAnimal} onChange={e => setFiltroEstadoAnimal(e.target.value)}>
            <option value="ACTIVOS">Activos</option>
            <option value="VENDIDOS">Vendidos</option>
            <option value="INACTIVOS">Inactivos</option>
            <option value="TODOS">Todos</option>
          </select>
          {isAdmin && (
            <button onClick={openCreateModal} className="btn-primary">
              Registrar Nuevo Animal
            </button>
          )}
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Arete</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Sexo</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Raza</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Categoría</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Ubicación</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {animalesFiltrados.map((animal) => (
              <tr key={animal.id} className={`hover:bg-gray-50 transition-colors ${animal.vendido || !animal.estado ? 'opacity-75 bg-gray-50' : ''}`}>
                <td translate="no" lang="zxx" className="px-6 py-4 font-bold text-primary-700">{animal.nroArete}</td>
                <td translate="no" lang="zxx" className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {animal.imagen ? (
                      <img src={animal.imagen} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                        {animal.nombre.charAt(0)}
                      </div>
                    )}
                    <span>{animal.nombre}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${animal.sexo === 'MACHO' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {animal.sexo}
                   </span>
                </td>
                <td className="px-6 py-4">{animal.raza?.nombre || '-'}</td>
                <td className="px-6 py-4">{animal.categoria?.nombre || '-'}</td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  {animal.vendido ? null : (() => {
                    const ub = ubicacionMap[animal.id];
                    if (ub) return (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        <MapPin size={11} />{ub.parcelaNombre}
                      </span>
                    );
                    if (animal.origen === 'COMPRADO') return (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Pend. ingreso</span>
                    );
                    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Sin ubicación</span>;
                  })()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${animal.vendido ? 'bg-orange-100 text-orange-700' : animal.estado ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {animal.vendido ? 'VENDIDO' : animal.estado ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center space-x-2">
                  <button onClick={() => openViewModal(animal.id)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver Detalle">
                    <Eye size={18} />
                  </button>
                  {isAdmin && !animal.vendido && (
                    <>
                      <button onClick={() => openEditModal(animal)} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleStatusChange(animal.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title={animal.estado ? "Desactivar/Eliminar" : "Reactivar"}>
                        <Power size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {animalesFiltrados.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-8">
                  <EmptyState 
                    title="No hay animales registrados"
                    message="No se encontraron animales para los filtros seleccionados o la hacienda está vacía."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Registrar Animal</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {renderFormFields()}
              <div className="flex space-x-3 pt-6 border-t mt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Editar Animal</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              {renderFormFields()}
              <div className="flex space-x-3 pt-6 border-t mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL (Ficha Técnica con Pestañas) */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay print:static print:inset-auto print:p-0">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-w-none print:w-full print:max-h-none print:overflow-visible print:p-0">
            <div className="no-print screen-only flex flex-col overflow-hidden max-h-[90vh]">
              <div className="p-4 border-b bg-white flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Expediente Digital</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => printAnimalDocument('EXPEDIENTE')} 
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-gray-200"
                    title="Imprimir Expediente Completo"
                  >
                    <Printer size={18} />
                  </button>
                  {(isAdmin || user?.role === 'VETERINARIO') && (
                    <button 
                      onClick={() => printAnimalDocument('HISTORIA_CLINICA')} 
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
                      title="Imprimir Historia Clínica"
                    >
                      <History size={18} />
                    </button>
                  )}
                  <button onClick={() => setShowViewModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>
            
            {!animalDetail && !errorDetail ? (
              <div className="p-16">
                <LoadingSpinner text="Cargando expediente digital..." />
              </div>
            ) : errorDetail ? (
              <div className="p-16 text-center">
                <p className="text-red-500 font-bold mb-4">{errorDetail}</p>
                <button onClick={() => setShowViewModal(false)} className="btn-secondary px-6">Cerrar</button>
              </div>
            ) : animalDetail ? (
              <>
                {/* Header Ficha */}
                <div className="bg-gray-50 p-6 border-b flex items-start gap-6">
                  {animalDetail?.imagen ? (
                    <img src={animalDetail.imagen} alt={animalDetail?.nombre} className="w-24 h-24 rounded-lg object-cover shadow-sm bg-white" />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-3xl shadow-sm">
                      {animalDetail?.nombre?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 translate="no" lang="zxx" className="text-2xl font-bold text-gray-900">{animalDetail?.nombre || 'Animal'}</h3>
                        <p className="text-primary-600 font-semibold text-lg flex items-center gap-2">
                          #{animalDetail?.nroArete || '—'}
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${animalDetail?.sexo === 'MACHO' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                            {animalDetail?.sexo || '—'}
                          </span>
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${animalDetail?.vendido ? 'bg-gray-200 text-gray-700' : (animalDetail?.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                        {animalDetail?.vendido ? 'VENDIDO' : (animalDetail?.estado ? 'ACTIVO' : 'INACTIVO')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabs Navbar */}
                <div className="flex border-b px-6 bg-gray-50/50">
                  <button 
                    onClick={() => setActiveDetailTab('general')} 
                    className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeDetailTab === 'general' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Datos Generales
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('genealogia')} 
                    className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeDetailTab === 'genealogia' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Genealogía
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('descendencia')} 
                    className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeDetailTab === 'descendencia' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Descendencia {descendenciaData && !descendenciaData.error && descendenciaData.hijos ? `(${descendenciaData.hijos.length})` : ''}
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('ubicacion')} 
                    className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeDetailTab === 'ubicacion' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Ubicación {movimientosData.length > 0 ? `(${movimientosData.length})` : ''}
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('alimentacion')} 
                    className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeDetailTab === 'alimentacion' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Alimentación {alimentacionData.length > 0 ? `(${alimentacionData.length})` : ''}
                  </button>
                </div>

                {/* Content Ficha */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
                  
                  {/* TAB: DATOS GENERALES */}
                  {activeDetailTab === 'general' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Clasificación</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between"><span className="text-gray-500">Raza:</span> <span className="font-semibold text-gray-900">{animalDetail?.raza?.nombre || '—'}</span></li>
                          <li className="flex justify-between"><span className="text-gray-500">Categoría:</span> <span className="font-semibold text-gray-900">{animalDetail?.categoria?.nombre || '—'}</span></li>
                          <li className="flex justify-between"><span className="text-gray-500">Peso actual:</span> <span className="font-semibold text-gray-900">{animalDetail?.peso ? `${animalDetail.peso} kg` : '—'}</span></li>
                        </ul>
                        
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-6 border-t pt-4">Padres Directos</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between"><span className="text-gray-500">Padre:</span> <span className="font-semibold text-gray-900">{animalDetail?.padre?.nombre || 'No registrado'}</span></li>
                          <li className="flex justify-between"><span className="text-gray-500">Madre:</span> <span className="font-semibold text-gray-900">{animalDetail?.madre?.nombre || 'No registrada'}</span></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Origen y Edad</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between"><span className="text-gray-500">Origen:</span> <span className="font-semibold text-gray-900">{animalDetail?.origen || '—'}</span></li>
                          {animalDetail?.origen === 'NACIDO' && (
                            <li className="flex justify-between"><span className="text-gray-500">Fecha Nacimiento:</span> <span className="font-semibold text-gray-900">{animalDetail?.fechaNacimiento ? new Date(animalDetail.fechaNacimiento).toLocaleDateString() : '—'}</span></li>
                          )}
                          {animalDetail?.origen === 'COMPRADO' && (
                            <>
                              <li className="flex justify-between"><span className="text-gray-500">Fecha Ingreso:</span> <span className="font-semibold text-gray-900">{animalDetail?.fechaIngreso ? new Date(animalDetail.fechaIngreso).toLocaleDateString() : '—'}</span></li>
                              <li className="flex justify-between"><span className="text-gray-500">Edad al ingreso:</span> <span className="font-semibold text-gray-900">{animalDetail?.edadIngresoMeses !== null && animalDetail?.edadIngresoMeses !== undefined ? `${animalDetail.edadIngresoMeses} meses` : '—'}</span></li>
                              <li className="flex justify-between items-center">
                                <span className="text-gray-500">Precio de Compra:</span>
                                {animalDetail?.precioCompra !== null && animalDetail?.precioCompra !== undefined
                                  ? <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Bs. {Number(animalDetail.precioCompra).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                  : <span className="text-gray-400 italic text-xs">No registrado</span>
                                }
                              </li>
                            </>
                          )}
                          <li className="flex justify-between"><span className="text-gray-500">Edad Actual:</span> <span className="font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{formatMonthsToText(animalDetail?.edadActualMeses)}</span></li>
                        </ul>

                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-6 border-t pt-4">Ubicación Actual</h4>
                        {(() => {
                          const movActivo = movimientosData.find(m => !m.fechaSalida);
                          if (loadingMovimientos) return <p className="text-sm text-gray-400 italic">Cargando ubicación...</p>;
                          if (movActivo) return (
                            <ul className="space-y-2 text-sm">
                              <li className="flex justify-between">
                                <span className="text-gray-500">Parcela:</span>
                                <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                                  <MapPin size={13} />{movActivo.parcela?.nombre}
                                </span>
                              </li>
                              <li className="flex justify-between"><span className="text-gray-500">Desde:</span> <span className="font-semibold text-gray-900">{new Date(movActivo.fechaIngreso).toLocaleDateString()}</span></li>
                              {movActivo.observacion && <li className="flex justify-between"><span className="text-gray-500">Obs.:</span> <span className="font-semibold text-gray-900 text-right max-w-[60%]">{movActivo.observacion}</span></li>}
                            </ul>
                          );
                          if (animalDetail?.origen === 'COMPRADO') return (
                            <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-3 space-y-2">
                              <p className="font-bold">Animal comprado pendiente de ingreso físico a parcela.</p>
                              <p>Debe registrarse su ingreso desde el módulo Ubicación.</p>
                              <div className="pt-2">
                                <a href="/movimientos" className="inline-block px-4 py-2 bg-yellow-600 text-white rounded font-bold hover:bg-yellow-700 transition-colors text-xs text-center">
                                  Registrar ingreso a parcela
                                </a>
                              </div>
                            </div>
                          );
                          return <p className="text-sm text-gray-400 italic">Sin ubicación asignada.</p>;
                        })()}
                      </div>
                    </div>
                  )}

                  {/* TAB: UBICACIÓN */}
                  {activeDetailTab === 'ubicacion' && (
                    <div>
                      {loadingMovimientos ? (
                        <div className="py-10">
                          <LoadingSpinner text="Cargando historial..." />
                        </div>
                      ) : movimientosData.length === 0 ? (
                        <div className="py-12">
                          <EmptyState 
                            title="Sin movimientos registrados"
                            message={animalDetail?.origen === 'COMPRADO' 
                              ? 'Animal comprado pendiente de ingreso físico a parcela. Debe registrarse su ingreso desde el módulo Ubicación.' 
                              : 'Este animal aún no tiene movimientos entre parcelas registrados.'}
                          />
                          {animalDetail?.origen === 'COMPRADO' && (
                            <div className="mt-4 text-center">
                              <a href="/movimientos" className="inline-block px-4 py-2 bg-yellow-600 text-white rounded font-bold hover:bg-yellow-700 transition-colors text-xs">
                                Registrar ingreso a parcela
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {movimientosData.map((mov) => (
                            <div key={mov.id} className="relative pl-6 pb-6 border-l-2 border-blue-200 last:border-0 last:pb-0">
                              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500" />
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-800 flex items-center gap-1">
                                    <MapPin size={15} className="text-blue-500" />{mov.parcela?.nombre}
                                  </h4>
                                  {!mov.fechaSalida
                                    ? <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Actual</span>
                                    : <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">Finalizado</span>
                                  }
                                </div>
                                <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-2">
                                  <div><span className="font-semibold block text-xs text-gray-400">Fecha Ingreso:</span>{new Date(mov.fechaIngreso).toLocaleDateString()}</div>
                                  {mov.fechaSalida && <div><span className="font-semibold block text-xs text-gray-400">Fecha Salida:</span>{new Date(mov.fechaSalida).toLocaleDateString()}</div>}
                                </div>
                                {mov.observacion && (
                                  <div className="mt-3 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100 shadow-sm">
                                    <span className="font-semibold block text-xs text-gray-400 mb-1">Observación:</span>
                                    {mov.observacion}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: GENEALOGÍA */}
                  {activeDetailTab === 'genealogia' && (
                    <div>
                      {genealogyData?.error ? (
                        <div className="text-red-500 text-center py-10 bg-red-50 rounded-lg border border-red-100">Hubo un error al cargar el árbol genealógico.</div>
                      ) : genealogyData ? (
                        <div className="flex flex-col items-center space-y-8 py-4 overflow-x-auto">
                          
                          {/* Nivel 1: Abuelos */}
                          <div className="flex justify-center gap-4 w-full min-w-[600px]">
                            <div className="w-1/4"><GenealogyCard animal={genealogyData.padre?.padre} title="Abuelo Paterno" color="gray" /></div>
                            <div className="w-1/4"><GenealogyCard animal={genealogyData.padre?.madre} title="Abuela Paterna" color="gray" /></div>
                            <div className="w-1/4"><GenealogyCard animal={genealogyData.madre?.padre} title="Abuelo Materno" color="gray" /></div>
                            <div className="w-1/4"><GenealogyCard animal={genealogyData.madre?.madre} title="Abuela Materna" color="gray" /></div>
                          </div>

                          {/* Conectores Abuelos -> Padres (Visual) */}
                          <div className="w-full min-w-[600px] flex justify-center relative h-8">
                             <div className="absolute w-1/4 border-t-2 border-gray-300 left-[25%] top-4"></div>
                             <div className="absolute w-1/4 border-t-2 border-gray-300 right-[25%] top-4"></div>
                             <div className="absolute h-4 border-l-2 border-gray-300 left-[25%] top-4"></div>
                             <div className="absolute h-4 border-l-2 border-gray-300 right-[25%] top-4"></div>
                             <div className="absolute h-4 border-l-2 border-gray-300 left-[37.5%] top-0"></div>
                             <div className="absolute h-4 border-l-2 border-gray-300 right-[37.5%] top-0"></div>
                             <div className="absolute h-4 border-l-2 border-gray-300 left-[12.5%] top-0"></div>
                             <div className="absolute h-4 border-l-2 border-gray-300 right-[12.5%] top-0"></div>
                          </div>

                          {/* Nivel 2: Padres */}
                          <div className="flex justify-center gap-16 w-full min-w-[600px] max-w-2xl px-8">
                            <div className="w-1/2 relative z-10"><GenealogyCard animal={genealogyData.padre} title="Padre" color="blue" /></div>
                            <div className="w-1/2 relative z-10"><GenealogyCard animal={genealogyData.madre} title="Madre" color="pink" /></div>
                          </div>

                          {/* Conectores Padres -> Animal */}
                          <div className="w-full min-w-[600px] flex justify-center relative h-8">
                             <div className="absolute w-[calc(50%+4rem)] max-w-md border-t-2 border-gray-300 top-4"></div>
                             <div className="absolute h-4 border-l-2 border-gray-300 top-4"></div>
                             <div className="absolute h-4 border-l-2 border-gray-300 left-[calc(25%-1rem)] top-0"></div>
                             <div className="absolute h-4 border-l-2 border-gray-300 right-[calc(25%-1rem)] top-0"></div>
                          </div>

                          {/* Nivel 3: Animal Actual */}
                          <div className="w-full max-w-xs relative z-10">
                            <GenealogyCard animal={genealogyData} title="Animal Actual" color="primary" />
                          </div>

                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* TAB: DESCENDENCIA */}
                  {activeDetailTab === 'descendencia' && (
                    <div>
                      {descendenciaData?.error ? (
                        <div className="text-red-500 text-center py-10 bg-red-50 rounded-lg border border-red-100">Hubo un error al cargar la descendencia.</div>
                      ) : descendenciaData ? (
                        <div>
                          {!descendenciaData.hijos || descendenciaData.hijos.length === 0 ? (
                            <div className="py-12">
                              <EmptyState 
                                title="Sin descendencia registrada"
                                message="Este animal aún no tiene crías registradas en el sistema."
                              />
                            </div>
                          ) : (
                            <div className="border rounded-lg overflow-hidden shadow-sm">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 border-b">
                                  <tr>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Arete</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Nombre</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Sexo</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {descendenciaData.hijos.map(hijo => (
                                    <tr key={hijo.id} className="hover:bg-gray-50">
                                      <td translate="no" lang="zxx" className="px-4 py-3 font-bold text-primary-700">{hijo.nroArete}</td>
                                      <td translate="no" lang="zxx" className="px-4 py-3">{hijo.nombre}</td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${hijo.sexo === 'MACHO' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                          {hijo.sexo}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${hijo.vendido ? 'bg-gray-200 text-gray-700' : (hijo.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                                          {hijo.vendido ? 'Vendido' : (hijo.estado ? 'Activo' : 'Inactivo')}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                  {/* TAB: ALIMENTACIÓN */}
                  {activeDetailTab === 'alimentacion' && (
                    <div>
                      {loadingAlimentacion ? (
                        <div className="py-10">
                          <LoadingSpinner text="Cargando historial de alimentación..." />
                        </div>
                      ) : (alimentacionData || []).length === 0 ? (
                        <div className="py-12">
                          <EmptyState 
                            title="Sin alimentación registrada"
                            message="No hay suministros de alimento registrados para este animal."
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {alimentacionData.map((alim) => (
                            <div key={alim.id} className={`relative pl-6 pb-6 border-l-2 ${alim.estado === false ? 'border-gray-200' : 'border-primary-200'} last:border-0 last:pb-0`}>
                              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 ${alim.estado === false ? 'border-gray-400' : 'border-primary-500'}`} />
                              <div className={`rounded-xl p-4 border shadow-sm transition-all ${alim.estado === false ? 'bg-gray-100/50 border-gray-200 opacity-70' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex flex-col gap-1">
                                    <h4 translate="no" lang="zxx" className={`font-bold flex items-center gap-2 ${alim.estado === false ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                      <span className={alim.estado === false ? 'grayscale' : ''}>🍴</span>
                                      {alim.alimento?.nombre || 'Alimento desconocido'}
                                    </h4>
                                    {alim.estado === false ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase w-fit">Anulado</span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase w-fit">Activo</span>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-100">
                                      {formatDateSafe(alim.fecha)}
                                    </span>
                                    {alim.estado !== false && (user?.role === 'ADMIN' || user?.role === 'VETERINARIO') && (
                                      <button 
                                        onClick={() => handleAnnulAlimentacion(alim.id)} 
                                        className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                                      >
                                        Anular
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-2">
                                  <div>
                                    <span className="font-semibold block text-xs text-gray-400 uppercase tracking-tight">Cantidad:</span>
                                    <span className={`font-bold ${alim.estado === false ? 'text-gray-500' : 'text-primary-600'}`}>{alim.cantidad} {alim.alimento?.unidadMedida}</span>
                                  </div>
                                </div>
                                {alim.observacion && (
                                  <div className="mt-3 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100 italic">
                                    <span className="font-semibold block text-xs text-gray-400 mb-1 not-italic">Observación:</span>
                                    "{alim.observacion}"
                                  </div>
                                )}
                                {alim.estado === false && alim.motivoAnulacion && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700">
                                    <span className="font-bold block uppercase tracking-tighter mb-1">Motivo de anulación:</span>
                                    {alim.motivoAnulacion}
                                    {alim.fechaAnulacion && <span className="block mt-1 opacity-60 italic text-[10px]">Anulado el: {formatDateSafe(alim.fechaAnulacion)}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t bg-gray-50">
                  <button onClick={() => setShowViewModal(false)} className="w-full btn-secondary">Cerrar Expediente</button>
                </div>
              </>
            ) : null}
            </div>
            {/* Componente de Impresión */}
            {animalDetail && (
              <PrintAnimalRecord
                mode={printMode}
                animal={animalDetail}
                genealogyData={genealogyData}
                descendenciaData={descendenciaData}
                movimientosData={movimientosData}
                alimentacionData={alimentacionData}
                sanidadData={sanidadData}
                user={user}
                role={user?.role}
              />
            )}
          </div>
        </div>
      )}

      {/* Modales de Confirmación y Prompt UX */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        isLoading={modalLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        message={promptModal.message}
        label={promptModal.label}
        placeholder={promptModal.placeholder}
        variant={promptModal.variant}
        confirmText={promptModal.confirmText}
        isLoading={modalLoading}
        onConfirm={promptModal.onConfirm}
        onCancel={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Animales;
