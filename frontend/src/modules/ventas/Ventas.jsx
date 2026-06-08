import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Eye, Power, Plus, Trash2, Edit2, Users, BadgeDollarSign, Search, FilterX, Calendar, Printer } from 'lucide-react';
import PrintReceipt from '../../components/PrintReceipt';
import ConfirmModal from '../../components/ConfirmModal';
import PromptModal from '../../components/PromptModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { triggerPrint, cleanupPrint } from '../../utils/printDocument';

const Ventas = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isSalesStaff = user?.role === 'ADMIN' || user?.role === 'VENDEDOR';
  const canAnnulSale = user?.role === 'ADMIN';

  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [animalesDisponibles, setAnimalesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ventas');
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [showClienteModal, setShowClienteModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  const initialClienteState = { nombre: '', telefono: '', direccion: '' };
  const [clienteData, setClienteData] = useState(initialClienteState);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);

  const initialVentaState = {
    clienteId: '',
    numeroFactura: '',
    observacion: '',
    detalles: [{ id: Date.now(), animalId: '', pesoVenta: '', precioKg: '' }]
  };
  const [ventaData, setVentaData] = useState(initialVentaState);

  // Estados para nuevos modales UX
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [modalLoading, setModalLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [clientSaving, setClientSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener('afterprint', cleanupPrint);
    return () => {
      window.removeEventListener('afterprint', cleanupPrint);
      cleanupPrint();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resVentas, resClientes, resAnimals] = await Promise.allSettled([
        api.get('/ventas'),
        api.get('/clientes'),
        api.get('/animals')
      ]);

      if (resVentas.status === 'fulfilled') {
        setVentas(resVentas.value.data);
      } else {
        console.error('Error fetching ventas:', resVentas.reason);
        setVentas([]);
      }

      if (resClientes.status === 'fulfilled') {
        setClientes(resClientes.value.data);
      } else {
        console.error('Error fetching clientes:', resClientes.reason);
        setClientes([]);
      }

      if (resAnimals.status === 'fulfilled') {
        setAnimalesDisponibles(resAnimals.value.data.filter(a => a.estado && !a.vendido));
      } else {
        console.error('Error fetching animals:', resAnimals.reason);
        setAnimalesDisponibles([]);
      }
    } catch (error) {
      console.error('Error unexpected in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = (id) => {
    setPromptModal({
      isOpen: true,
      title: 'Anular Venta',
      message: 'Esta acción revertirá la disponibilidad del animal. Ingrese el motivo de anulación.',
      label: 'Motivo de anulación',
      placeholder: 'Ej: Error de peso, cliente canceló...',
      confirmText: 'Anular Venta',
      variant: 'danger',
      onConfirm: async (motivo) => {
        setModalLoading(true);
        try {
          await api.patch(`/ventas/${id}/anular`, { motivoAnulacion: motivo });
          setPromptModal(prev => ({ ...prev, isOpen: true, isLoading: false })); // Esto se cerrará abajo
          setShowDetailModal(false);
          fetchData();
          setPromptModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          alert(error.response?.data?.error || 'Error al anular venta');
        } finally {
          setModalLoading(false);
        }
      }
    });
  };

  const openDetailModal = async (id) => {
    try {
      const { data } = await api.get(`/ventas/${id}`);
      setSelectedVenta(data);
      setShowDetailModal(true);
    } catch (error) {
      alert('Error al cargar detalle de venta');
    }
  };

  const openClienteModal = (cliente = null) => {
    if (cliente) {
      setSelectedCliente(cliente);
      setClienteData({ nombre: cliente.nombre, telefono: cliente.telefono || '', direccion: cliente.direccion || '' });
    } else {
      setSelectedCliente(null);
      setClienteData(initialClienteState);
    }
    setShowClienteModal(true);
  };

  const handleClienteSubmit = async (e) => {
    e.preventDefault();
    setClientSaving(true);
    try {
      if (selectedCliente) {
        await api.put(`/clientes/${selectedCliente.id}`, clienteData);
      } else {
        await api.post('/clientes', clienteData);
      }
      setShowClienteModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al guardar cliente');
    } finally {
      setClientSaving(false);
    }
  };

  const handleClienteStatusChange = (cliente) => {
    const isActivating = !cliente.estado;
    setConfirmModal({
      isOpen: true,
      title: isActivating ? 'Reactivar Cliente' : 'Desactivar Cliente',
      message: isActivating 
        ? `¿Seguro que deseas reactivar a ${cliente.nombre}? Volverá a estar disponible para nuevas ventas.` 
        : `¿Seguro que deseas desactivar a ${cliente.nombre}? Dejará de aparecer como opción para nuevas ventas.`,
      variant: isActivating ? 'success' : 'danger',
      confirmText: isActivating ? 'Reactivar' : 'Desactivar',
      onConfirm: async () => {
        setModalLoading(true);
        try {
          await api.patch(`/clientes/${cliente.id}/estado`);
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

  const handleAddDetalle = () => {
    setVentaData(prev => ({
      ...prev,
      detalles: [...prev.detalles, { id: Date.now(), animalId: '', pesoVenta: '', precioKg: '' }]
    }));
  };

  const handleRemoveDetalle = (id) => {
    setVentaData(prev => ({
      ...prev,
      detalles: prev.detalles.filter(d => d.id !== id)
    }));
  };

  const handleDetalleChange = (id, field, value) => {
    setVentaData(prev => ({
      ...prev,
      detalles: prev.detalles.map(d => d.id === id ? { ...d, [field]: value } : d)
    }));
  };

  const totalCalculado = ventaData.detalles.reduce((acc, d) => acc + ((parseFloat(d.pesoVenta) || 0) * (parseFloat(d.precioKg) || 0)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (!ventaData.clienteId) throw new Error('Seleccione un cliente');
      if (ventaData.detalles.length === 0) throw new Error('Agregue al menos un animal a la venta');

      const animalIds = ventaData.detalles.map(d => d.animalId).filter(id => id !== '');
      if (new Set(animalIds).size !== animalIds.length) {
        throw new Error('No puede repetir el mismo animal en la misma venta');
      }

      const detallesProcesados = ventaData.detalles.map(d => {
        if (!d.animalId) throw new Error('Seleccione un animal en todas las filas');
        const pesoVenta = parseFloat(d.pesoVenta);
        if (isNaN(pesoVenta) || pesoVenta <= 0) throw new Error('El peso de venta debe ser mayor a 0');
        const precioKg = parseFloat(d.precioKg);
        if (isNaN(precioKg) || precioKg <= 0) throw new Error('El precio por kg debe ser mayor a 0');
        return { animalId: parseInt(d.animalId), pesoVenta, precioKg };
      });

      await api.post('/ventas', {
        clienteId: parseInt(ventaData.clienteId),
        numeroFactura: ventaData.numeroFactura || null,
        observacion: ventaData.observacion || null,
        detalles: detallesProcesados
      });

      setShowCreateModal(false);
      setVentaData(initialVentaState);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Error al procesar la venta');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getDateString = (dateValue) => {
    if (!dateValue) return '';
    return String(dateValue).split('T')[0];
  };

  const ventasFiltradas = ventas.filter(v => {
    const st = searchTerm.toLowerCase();
    const searchMatch = !st || 
      v.numeroFactura?.toLowerCase().includes(st) || 
      v.cliente?.nombre?.toLowerCase().includes(st) ||
      v.observacion?.toLowerCase().includes(st) ||
      v.detalles?.some(d => 
        d.animal?.nombre?.toLowerCase().includes(st) ||
        d.animal?.nroArete?.toLowerCase().includes(st) ||
        d.animal?.codigo?.toLowerCase().includes(st)
      );
      
    const statusMatch = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVA' && v.estado === true) ||
      (statusFilter === 'ANULADA' && v.estado === false);
      
    const vDate = getDateString(v.fecha);
    const dateFromMatch = !dateFrom || vDate >= dateFrom;
    const dateToMatch = !dateTo || vDate <= dateTo;

    return searchMatch && statusMatch && dateFromMatch && dateToMatch;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const totalVisible = ventasFiltradas.length;
  const totalActivas = ventasFiltradas.filter(v => v.estado).length;
  const totalAnuladas = ventasFiltradas.filter(v => !v.estado).length;
  
  const totalIngresosActivos = ventasFiltradas
    .filter(v => v.estado)
    .reduce((sum, v) => sum + Number(v.total || 0), 0);
    
  const animalesVendidosActivos = ventasFiltradas
    .filter(v => v.estado)
    .reduce((sum, v) => sum + (v.detalles?.length || 0), 0);

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner text="Cargando ventas y clientes..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Módulo de Ventas</h2>
          <p className="text-gray-500">Gestión de ingresos por comercialización de ganado</p>
        </div>
        {isSalesStaff && activeTab === 'ventas' && (
          <button onClick={() => { setVentaData(initialVentaState); setShowCreateModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Nueva Venta
          </button>
        )}
        {isSalesStaff && activeTab === 'clientes' && (
          <button onClick={() => openClienteModal()} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Nuevo Cliente
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'ventas' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('ventas')}
        >
          <BadgeDollarSign size={16} />
          Ventas
        </button>
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'clientes' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('clientes')}
        >
          <Users size={16} />
          Clientes
        </button>
      </div>

      {activeTab === 'ventas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="card p-4 flex flex-col justify-center items-center bg-white border border-gray-100 shadow-sm">
              <span className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase text-center">Ventas Visibles</span>
              <span className="text-xl font-black text-gray-800">{totalVisible}</span>
            </div>
            <div className="card p-4 flex flex-col justify-center items-center bg-green-50 border border-green-100 shadow-sm">
              <span className="text-green-600 text-[10px] sm:text-xs font-bold uppercase text-center">Ventas Activas</span>
              <span className="text-xl font-black text-green-700">{totalActivas}</span>
            </div>
            <div className="card p-4 flex flex-col justify-center items-center bg-red-50 border border-red-100 shadow-sm">
              <span className="text-red-600 text-[10px] sm:text-xs font-bold uppercase text-center">Ventas Anuladas</span>
              <span className="text-xl font-black text-red-700">{totalAnuladas}</span>
            </div>
            <div className="card p-4 flex flex-col justify-center items-center bg-primary-50 border border-primary-100 shadow-sm col-span-2 md:col-span-1">
              <span className="text-primary-600 text-[10px] sm:text-xs font-bold uppercase text-center">Ingresos Activos</span>
              <span className="text-xl font-black text-primary-700 font-mono">${totalIngresosActivos.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="card p-4 flex flex-col justify-center items-center bg-amber-50 border border-amber-100 shadow-sm col-span-2 md:col-span-1">
              <span className="text-amber-600 text-[10px] sm:text-xs font-bold uppercase text-center">Ganado Vendido</span>
              <span className="text-xl font-black text-amber-700">{animalesVendidosActivos}</span>
            </div>
          </div>

          <div className="card p-4 bg-gray-50 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Buscar</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Factura, cliente, arete, obs..." className="input pl-9 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="w-full md:w-36">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Estado</label>
              <select className="input w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">Todas</option>
                <option value="ACTIVA">Activas</option>
                <option value="ANULADA">Anuladas</option>
              </select>
            </div>
            <div className="w-full md:w-32">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Desde</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" className="input pl-9 w-full text-sm py-2" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
            </div>
            <div className="w-full md:w-32">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Hasta</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" className="input pl-9 w-full text-sm py-2" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
            <button onClick={clearFilters} className="btn-secondary whitespace-nowrap flex items-center gap-2 h-[42px]">
              <FilterX size={16} /> Limpiar
            </button>
          </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Fecha</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Cliente</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Animales</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Total</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ventasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12">
                  <EmptyState 
                    title={searchTerm || dateFrom || dateTo ? "Sin resultados" : "Sin ventas registradas"}
                    message={searchTerm || dateFrom || dateTo 
                      ? "No se encontraron ventas con los filtros aplicados." 
                      : "Cuando registres ventas por peso, aparecerán en este historial."}
                  />
                </td>
              </tr>
            ) : ventasFiltradas.map((v) => (
              <tr key={v.id} className={`hover:bg-gray-50 transition-colors ${!v.estado ? 'opacity-75 bg-red-50' : ''}`}>
                <td className="px-6 py-4 text-gray-500">{new Date(v.fecha).toLocaleDateString()}</td>
                <td translate="no" lang="zxx" className="px-6 py-4 font-medium text-gray-900">{v.cliente?.nombre}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${v.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {v.estado ? 'Activa' : 'Anulada'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-center">{v.detalles?.length || 0}</td>
                <td className="px-6 py-4 text-right font-bold text-green-600">${(v.total || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-center space-x-3">
                  <button onClick={() => openDetailModal(v.id)} className="text-gray-500 hover:text-primary-600 p-2" title="Ver Detalle">
                    <Eye size={18} />
                  </button>
                  {canAnnulSale && v.estado && (
                    <button onClick={() => handleAnular(v.id)} className="text-gray-500 hover:text-red-600 p-2" title="Anular Venta">
                      <Power size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </div>
      )}

      {activeTab === 'clientes' && (
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Teléfono</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Dirección</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientes.map((c) => (
              <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${!c.estado ? 'opacity-60 bg-gray-50 grayscale-[0.5]' : ''}`}>
                <td className="px-6 py-4 font-medium text-gray-900">{c.nombre}</td>
                <td className="px-6 py-4 text-gray-500">{c.telefono || '-'}</td>
                <td className="px-6 py-4 text-gray-500">{c.direccion || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${c.estado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {c.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center space-x-3">
                  <button onClick={() => openClienteModal(c)} className="text-gray-500 hover:text-primary-600 p-2" title="Editar">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleClienteStatusChange(c)} className={`${c.estado ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'} p-2`} title={c.estado ? 'Desactivar' : 'Activar'}>
                    <Power size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12">
                  <EmptyState 
                    title="Sin clientes registrados"
                    message="Registra clientes para poder generar nuevas ventas."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {showDetailModal && selectedVenta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay print:static print:inset-auto print:p-0">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:w-full print:max-h-none print:overflow-visible print:p-0">
            <div className="no-print screen-only">
              <h3 className="text-xl font-bold mb-6">Detalle de Venta #{selectedVenta.id}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Cliente</p>
                <p translate="no" lang="zxx" className="font-bold text-gray-900 text-lg">{selectedVenta.cliente?.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Fecha de Venta</p>
                <p className="font-bold text-gray-900">{new Date(selectedVenta.fecha).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Nº Factura / Doc</p>
                <p className="font-bold text-gray-900">{selectedVenta.numeroFactura || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Estado</p>
                <span className={`px-2 py-1 inline-block mt-1 rounded text-xs font-bold ${selectedVenta.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedVenta.estado ? 'Activa' : 'Anulada'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Total General</p>
                <p className="font-bold text-green-600 text-xl">${(selectedVenta.total || 0).toLocaleString()}</p>
              </div>
              {!selectedVenta.estado && selectedVenta.fechaAnulacion && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Fecha de Anulación</p>
                  <p className="font-bold text-red-600">{String(selectedVenta.fechaAnulacion).split('T')[0]}</p>
                </div>
              )}
            </div>

            {selectedVenta.observacion && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Observaciones</p>
                <p className="text-sm text-yellow-900">{selectedVenta.observacion}</p>
              </div>
            )}

            {!selectedVenta.estado && selectedVenta.motivoAnulacion && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs font-bold text-red-800 uppercase mb-1">Motivo de Anulación</p>
                <p className="text-sm text-red-900">{selectedVenta.motivoAnulacion}</p>
              </div>
            )}

            <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Animales Vendidos</h4>
            <div className="space-y-3">
              {selectedVenta.detalles?.map(d => (
                <div key={d.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 border border-gray-100 rounded-lg bg-white">
                  <div>
                    <span className="text-xs font-bold bg-primary-100 text-primary-700 px-2 py-1 rounded mr-2">Ganado</span>
                    <span translate="no" lang="zxx" className="font-medium text-gray-900">
                      {d.animal?.nroArete} - {d.animal?.nombre}
                    </span>
                    <div className="text-xs text-gray-500 mt-1 font-mono">
                      {d.pesoVenta ? `${Number(d.pesoVenta).toFixed(2)} kg × $${Number(d.precioKg).toFixed(2)}/kg` : `${d.cantidad} unid. × $${d.precio}`}
                    </div>
                    {d.precioCompraAnimal !== null && d.gananciaAnimal !== null && d.precioCompraAnimal !== undefined && (
                      <div className="text-xs mt-2 flex gap-3">
                        <span className="text-rose-600 font-medium">Costo: ${(parseFloat(d.precioCompraAnimal)).toLocaleString()}</span>
                        <span className="text-emerald-600 font-bold">Ganancia: ${(parseFloat(d.gananciaAnimal)).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right mt-2 md:mt-0 w-full md:w-auto flex justify-between md:block border-t border-gray-100 md:border-0 pt-2 md:pt-0">
                    <span className="md:hidden text-xs font-bold text-gray-500 uppercase">Subtotal:</span>
                    <p className="font-bold text-gray-900">${d.subtotal.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => triggerPrint(null, { selector: '.receipt-print' })} className="btn-secondary flex items-center gap-2">
                <Printer size={18} />
                Imprimir Nota
              </button>
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">Cerrar Detalle</button>
            </div>
            </div>
            {/* Componente para impresión */}
            <PrintReceipt type="VENTA" data={selectedVenta} user={user} role={user?.role} />
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[95vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Registrar Nueva Venta</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Cliente *</label>
                  {clientes.filter(c => c.estado).length > 0 ? (
                    <select className="input w-full" required value={ventaData.clienteId} onChange={e => setVentaData({...ventaData, clienteId: e.target.value})}>
                      <option value="">Seleccione cliente...</option>
                      {clientes.filter(c => c.estado).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-sm font-bold text-red-600">No hay clientes activos disponibles.</p>
                      <p className="text-xs text-red-500">Registre o active un cliente primero.</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Factura / Recibo (Opcional)</label>
                  <input type="text" className="input w-full" placeholder="Ej: F001-0002" value={ventaData.numeroFactura} onChange={e => setVentaData({...ventaData, numeroFactura: e.target.value})} />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Observación (Opcional)</label>
                <textarea className="input w-full" rows="2" placeholder="Detalles de la venta..." value={ventaData.observacion} onChange={e => setVentaData({...ventaData, observacion: e.target.value})}></textarea>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h4 className="font-bold text-gray-800">Animales a Vender</h4>
                  <button type="button" onClick={handleAddDetalle} className="text-primary-600 hover:text-primary-800 text-sm font-bold flex items-center gap-1">
                    <Plus size={16} /> Agregar Animal
                  </button>
                </div>

                <div className="space-y-3">
                  {ventaData.detalles.map((d, index) => (
                    <div key={d.id} className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg bg-white relative">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-bold text-gray-500 block mb-1">Animal Disponible</label>
                          <select className="input !py-2 w-full" required value={d.animalId} onChange={e => {
                            const val = e.target.value;
                            handleDetalleChange(d.id, 'animalId', val);
                            const animal = animalesDisponibles.find(a => String(a.id) === String(val));
                            if (animal && animal.peso > 0) {
                              handleDetalleChange(d.id, 'pesoVenta', String(animal.peso));
                            }
                          }}>
                            <option value="">Seleccione animal...</option>
                            {animalesDisponibles.length > 0 ? (
                              animalesDisponibles.map(a => (
                                <option 
                                  key={a.id} 
                                  value={a.id}
                                  disabled={ventaData.detalles.some(det => det.animalId === String(a.id) && det.id !== d.id)}
                                >
                                  {a.nroArete} - {a.nombre}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>Sin animales disponibles</option>
                            )}
                          </select>
                        </div>

                        <div className="w-28">
                          <label className="text-xs font-bold text-gray-500 block mb-1">Peso (kg)</label>
                          <input type="number" step="0.01" min="0.01" className="input !py-2 w-full" required value={d.pesoVenta} onChange={e => handleDetalleChange(d.id, 'pesoVenta', e.target.value)} />
                        </div>

                        <div className="w-32">
                          <label className="text-xs font-bold text-gray-500 block mb-1">Precio por kg</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input type="number" step="0.01" min="0.01" className="input !py-2 pl-7 w-full" required value={d.precioKg} onChange={e => handleDetalleChange(d.id, 'precioKg', e.target.value)} />
                          </div>
                        </div>

                        <div className="w-32 flex flex-col justify-end pb-2">
                          <label className="text-xs font-bold text-gray-500 block mb-1">Subtotal</label>
                           <p className="font-bold text-gray-800 text-lg leading-none">${((parseFloat(d.pesoVenta) || 0) * (parseFloat(d.precioKg) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>

                        <div className="pt-5 pl-2 flex items-center">
                          {ventaData.detalles.length > 1 && (
                            <button type="button" onClick={() => handleRemoveDetalle(d.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Quitar animal">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                      {d.animalId && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 flex items-center gap-2">
                          <span className="text-[10px]">ℹ️</span>
                          {animalesDisponibles.find(a => String(a.id) === String(d.animalId))?.peso > 0 
                            ? 'Peso sugerido según ficha del animal. Modifique si el peso de balanza es diferente.' 
                            : 'Este animal no tiene peso registrado. Ingrese el peso real de balanza.'
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-6 mt-4">
                <div className="text-lg">
                  Total General: <span className="font-bold text-green-600 text-3xl ml-2">${totalCalculado.toLocaleString()}</span>
                </div>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary px-8">Cancelar</button>
                  <button 
                    type="submit" 
                    className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                    disabled={submitLoading || clientes.filter(c => c.estado).length === 0 || ventaData.detalles.some(d => !d.pesoVenta || !d.precioKg || d.pesoVenta <= 0 || d.precioKg <= 0 || !d.animalId) || new Set(ventaData.detalles.map(d => d.animalId)).size !== ventaData.detalles.length}
                  >
                    {submitLoading ? 'Procesando...' : 'Procesar Venta'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClienteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
            <form onSubmit={handleClienteSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre *</label>
                <input required type="text" className="input w-full" value={clienteData.nombre} onChange={e => setClienteData({...clienteData, nombre: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono</label>
                <input type="text" className="input w-full" value={clienteData.telefono} onChange={e => setClienteData({...clienteData, telefono: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Dirección</label>
                <input type="text" className="input w-full" value={clienteData.direccion} onChange={e => setClienteData({...clienteData, direccion: e.target.value})} />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowClienteModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={clientSaving} className="btn-primary flex-1">
                  {clientSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
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

export default Ventas;
