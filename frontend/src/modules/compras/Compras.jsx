import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Eye, Power, Plus, Trash2, Edit2, Truck, ShoppingCart, Search, Filter, Calendar, X, Printer } from 'lucide-react';
import PrintReceipt from '../../components/PrintReceipt';
import ConfirmModal from '../../components/ConfirmModal';
import PromptModal from '../../components/PromptModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { triggerPrint, cleanupPrint } from '../../utils/printDocument';

const formatDateSafe = (dateValue) => {
  if (!dateValue) return '';
  const dateString = String(dateValue).split('T')[0];
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const Compras = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [alimentos, setAlimentos] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('compras');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODAS');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');

  const initialCompraState = {
    proveedorId: '',
    numeroFactura: '',
    observacion: '',
    detalles: [{ id: Date.now(), tipo: 'alimento', itemId: '', cantidad: '', precio: '' }]
  };
  const [compraData, setCompraData] = useState(initialCompraState);

  // Estados para nuevos modales UX
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [modalLoading, setModalLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [providerSaving, setProviderSaving] = useState(false);

  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const initialProveedorState = { nombre: '', telefono: '', direccion: '' };
  const [proveedorData, setProveedorData] = useState(initialProveedorState);
  const [selectedProveedor, setSelectedProveedor] = useState(null);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resComp, resProv, resAlim, resMed] = await Promise.all([
        api.get('/compras'),
        api.get('/proveedores'),
        api.get('/alimentos'),
        api.get('/medicamentos')
      ]);
      setCompras(resComp.data);
      setProveedores(resProv.data);
      setAlimentos(resAlim.data.filter(a => a.estado));
      setMedicamentos(resMed.data.filter(m => m.estado));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openProveedorModal = (proveedor = null) => {
    if (proveedor) {
      setSelectedProveedor(proveedor);
      setProveedorData({
        nombre: proveedor.nombre || '',
        telefono: proveedor.telefono || '',
        direccion: proveedor.direccion || ''
      });
    } else {
      setSelectedProveedor(null);
      setProveedorData(initialProveedorState);
    }
    setShowProveedorModal(true);
  };

  const handleProveedorSubmit = async (e) => {
    e.preventDefault();
    setProviderSaving(true);
    try {
      if (selectedProveedor) {
        await api.put(`/proveedores/${selectedProveedor.id}`, proveedorData);
      } else {
        await api.post('/proveedores', proveedorData);
      }
      setShowProveedorModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al guardar proveedor');
    } finally {
      setProviderSaving(false);
    }
  };

  const handleProveedorStatusChange = (proveedor) => {
    const isActivating = !proveedor.estado;
    setConfirmModal({
      isOpen: true,
      title: isActivating ? 'Reactivar Proveedor' : 'Desactivar Proveedor',
      message: isActivating 
        ? `¿Seguro que deseas reactivar a ${proveedor.nombre}? Volverá a estar disponible para nuevas compras.` 
        : `¿Seguro que deseas desactivar a ${proveedor.nombre}? Dejará de aparecer como opción para nuevas compras.`,
      variant: isActivating ? 'success' : 'danger',
      confirmText: isActivating ? 'Reactivar' : 'Desactivar',
      onConfirm: async () => {
        setModalLoading(true);
        try {
          await api.patch(`/proveedores/${proveedor.id}/estado`);
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

  const handleAnular = (id) => {
    setPromptModal({
      isOpen: true,
      title: 'Anular Compra',
      message: 'Esta acción revertirá el stock de los insumos y no se puede deshacer. Ingrese el motivo de anulación.',
      label: 'Motivo de anulación',
      placeholder: 'Ej: Error de factura, devolución...',
      confirmText: 'Anular Compra',
      variant: 'danger',
      onConfirm: async (motivo) => {
        setModalLoading(true);
        try {
          await api.patch(`/compras/${id}/anular`, { motivoAnulacion: motivo });
          setShowDetailModal(false);
          fetchData();
          setPromptModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          alert(error.response?.data?.error || 'Error al anular compra');
        } finally {
          setModalLoading(false);
        }
      }
    });
  };

  const openDetailModal = async (id) => {
    try {
      const { data } = await api.get(`/compras/${id}`);
      setSelectedCompra(data);
      setShowDetailModal(true);
    } catch (error) {
      alert('Error al cargar detalle de compra');
    }
  };

  const handleAddDetalle = () => {
    setCompraData(prev => ({
      ...prev,
      detalles: [...prev.detalles, { id: Date.now(), tipo: 'alimento', itemId: '', cantidad: '', precio: '' }]
    }));
  };

  const handleRemoveDetalle = (id) => {
    setCompraData(prev => ({
      ...prev,
      detalles: prev.detalles.filter(d => d.id !== id)
    }));
  };

  const handleDetalleChange = (id, field, value) => {
    setCompraData(prev => ({
      ...prev,
      detalles: prev.detalles.map(d => {
        if (d.id === id) {
          const updated = { ...d, [field]: value };
          // Limpiar el itemId si se cambia el tipo para evitar envíos incorrectos
          if (field === 'tipo') {
            updated.itemId = '';
          }
          return updated;
        }
        return d;
      })
    }));
  };

  const totalCalculado = compraData.detalles.reduce((acc, d) => {
    const cant = parseFloat(d.cantidad) || 0;
    const prec = parseFloat(d.precio) || 0;
    return acc + (cant * prec);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (!compraData.proveedorId) throw new Error('Seleccione un proveedor');
      if (compraData.detalles.length === 0) throw new Error('Agregue al menos un detalle a la compra');

      const detallesProcesados = compraData.detalles.map(d => {
        if (!d.itemId) throw new Error('Debe seleccionar un insumo en todas las filas');
        const cant = parseFloat(d.cantidad);
        const prec = parseFloat(d.precio);
        
        if (isNaN(cant) || cant <= 0) throw new Error('La cantidad debe ser mayor a 0');
        if (isNaN(prec) || prec <= 0) throw new Error('El precio unitario debe ser mayor a 0.');

        return {
          alimentoId: d.tipo === 'alimento' ? parseInt(d.itemId) : null,
          medicamentoId: d.tipo === 'medicamento' ? parseInt(d.itemId) : null,
          cantidad: cant,
          precio: prec
        };
      });

      await api.post('/compras', {
        proveedorId: parseInt(compraData.proveedorId),
        numeroFactura: compraData.numeroFactura,
        observacion: compraData.observacion,
        detalles: detallesProcesados
      });
      
      setShowCreateModal(false);
      setCompraData(initialCompraState);
      fetchData();
    } catch (error) {
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert(error.message || 'Error al registrar la compra');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner text="Cargando compras y proveedores..." />
      </div>
    );
  }

  const getDateString = (dateValue) => {
    if (!dateValue) return '';
    return String(dateValue).split('T')[0];
  };

  const comprasFiltradas = compras.filter(c => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchFactura = c.numeroFactura?.toLowerCase().includes(term);
      const matchProveedor = c.proveedor?.nombre?.toLowerCase().includes(term);
      const matchObservacion = c.observacion?.toLowerCase().includes(term);
      if (!matchFactura && !matchProveedor && !matchObservacion) return false;
    }
    
    if (filterEstado === 'ACTIVA' && !c.estado) return false;
    if (filterEstado === 'ANULADA' && c.estado) return false;

    const fecha = getDateString(c.fecha);
    if (filterDesde && fecha < filterDesde) return false;
    if (filterHasta && fecha > filterHasta) return false;

    return true;
  });

  const totalVisible = comprasFiltradas.length;
  const totalActivas = comprasFiltradas.filter(c => c.estado).length;
  const totalAnuladas = comprasFiltradas.filter(c => !c.estado).length;
  const totalInversionActiva = comprasFiltradas
    .filter(c => c.estado)
    .reduce((sum, c) => sum + Number(c.total || 0), 0);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterEstado('TODAS');
    setFilterDesde('');
    setFilterHasta('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Módulo de Compras</h2>
          <p className="text-gray-500">Gestión de adquisiciones e inventario</p>
        </div>
        {isAdmin && activeTab === 'compras' && (
          <button onClick={() => { setCompraData(initialCompraState); setShowCreateModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Nueva Compra
          </button>
        )}
        {isAdmin && activeTab === 'proveedores' && (
          <button onClick={() => openProveedorModal()} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Nuevo Proveedor
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'compras' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('compras')}
        >
          <ShoppingCart size={16} />
          Compras
        </button>
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'proveedores' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('proveedores')}
        >
          <Truck size={16} />
          Proveedores
        </button>
      </div>

      {activeTab === 'compras' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1"><Search size={14}/> Buscar</label>
              <input type="text" className="input w-full" placeholder="Proveedor, factura, observación..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="w-40">
              <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1"><Filter size={14}/> Estado</label>
              <select className="input w-full" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
                <option value="TODAS">Todas</option>
                <option value="ACTIVA">Solo Activas</option>
                <option value="ANULADA">Solo Anuladas</option>
              </select>
            </div>
            <div className="w-36">
              <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1"><Calendar size={14}/> Desde</label>
              <input type="date" className="input w-full" value={filterDesde} onChange={e => setFilterDesde(e.target.value)} />
            </div>
            <div className="w-36">
              <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1"><Calendar size={14}/> Hasta</label>
              <input type="date" className="input w-full" value={filterHasta} onChange={e => setFilterHasta(e.target.value)} />
            </div>
            <button onClick={handleClearFilters} className="btn-secondary h-[42px] px-4 flex items-center gap-2" title="Limpiar filtros">
              <X size={16} /> Limpiar
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Visibles</p>
              <p className="text-2xl font-black text-gray-800">{totalVisible}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Activas</p>
              <p className="text-2xl font-black text-green-600">{totalActivas}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Anuladas</p>
              <p className="text-2xl font-black text-red-500">{totalAnuladas}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Inversión (Activa)</p>
              <p className="text-2xl font-black text-blue-600">${totalInversionActiva.toLocaleString()}</p>
            </div>
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Fecha</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Proveedor</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Ítems</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Total</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
            {comprasFiltradas.map((c) => (
              <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${!c.estado ? 'opacity-60 bg-gray-50 grayscale-[0.5]' : ''}`}>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(c.fecha).toLocaleDateString()}
                  {c.numeroFactura && <p className="text-xs text-gray-400 font-bold mt-1">Fac: {c.numeroFactura}</p>}
                </td>
                <td translate="no" lang="zxx" className="px-6 py-4 font-medium text-gray-900">{c.proveedor?.nombre}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${c.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.estado ? 'Activa' : 'Anulada'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-center">{c.detalles?.length || 0}</td>
                <td className="px-6 py-4 text-right font-bold text-red-600">${(c.total || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-center space-x-3">
                  <button onClick={() => openDetailModal(c.id)} className="text-gray-500 hover:text-primary-600 p-2" title="Ver Detalle">
                    <Eye size={18} />
                  </button>
                  {isAdmin && c.estado && (
                    <button onClick={() => handleAnular(c.id)} className="text-gray-500 hover:text-red-600 p-2" title="Anular Compra">
                      <Power size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {comprasFiltradas.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12">
                  <EmptyState 
                    title={searchTerm || filterDesde || filterHasta ? "Sin resultados" : "Sin compras registradas"}
                    message={searchTerm || filterDesde || filterHasta 
                      ? "No se encontraron compras con los filtros aplicados." 
                      : "Cuando registres compras de insumos, aparecerán en este historial."}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
      )}

      {activeTab === 'proveedores' && (
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
              {proveedores.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.estado ? 'bg-gray-100 opacity-60 grayscale-[0.5]' : ''}`}>
                  <td className="px-6 py-4 font-bold text-gray-800">{p.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">{p.telefono || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{p.direccion || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    {isAdmin && (
                      <>
                        <button onClick={() => openProveedorModal(p)} className="text-gray-500 hover:text-amber-600 p-2" title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleProveedorStatusChange(p)} className="text-gray-500 hover:text-red-600 p-2" title={p.estado ? "Desactivar" : "Reactivar"}>
                          <Power size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {proveedores.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12">
                    <EmptyState 
                      title="Sin proveedores registrados"
                      message="Registra proveedores para poder generar nuevas compras."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDetailModal && selectedCompra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay print:static print:inset-auto print:p-0">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:w-full print:max-h-none print:overflow-visible print:p-0">
            <div className="no-print screen-only">
              <h3 className="text-xl font-bold mb-6">Detalle de Compra #{selectedCompra.id}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Proveedor</p>
                <p translate="no" lang="zxx" className="font-bold text-gray-900 text-lg">{selectedCompra.proveedor?.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Fecha de Emisión</p>
                <p className="font-bold text-gray-900">{new Date(selectedCompra.fecha).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Estado</p>
                <span className={`px-2 py-1 inline-block mt-1 rounded text-xs font-bold ${selectedCompra.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedCompra.estado ? 'Activa' : 'Anulada'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Total General</p>
                <p className="font-bold text-red-600 text-xl">${(selectedCompra.total || 0).toLocaleString()}</p>
              </div>
              {selectedCompra.numeroFactura && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Factura / Recibo</p>
                  <p className="font-bold text-gray-900">{selectedCompra.numeroFactura}</p>
                </div>
              )}
              {selectedCompra.observacion && (
                <div className="col-span-2 mt-2">
                  <p className="text-xs text-gray-500 font-bold uppercase">Observaciones</p>
                  <p className="text-gray-700 text-sm italic">{selectedCompra.observacion}</p>
                </div>
              )}
              {!selectedCompra.estado && (
                <div className="col-span-2 mt-2 p-3 bg-red-50 border border-red-100 rounded text-red-800">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase">Fecha de Anulación</p>
                      <p className="font-bold">{formatDateSafe(selectedCompra.fechaAnulacion)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase">Motivo</p>
                      <p className="font-medium text-sm">{selectedCompra.motivoAnulacion || 'Sin motivo reportado'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Ítems Comprados</h4>
            <div className="space-y-3">
              {selectedCompra.detalles?.map(d => {
                const isAlimento = !!d.alimentoId;
                const nombreItem = isAlimento ? d.alimento?.nombre : d.medicamento?.nombre;
                const tipo = isAlimento ? 'Alimento' : 'Medicamento';
                const unidad = isAlimento ? d.alimento?.unidadMedida : d.medicamento?.unidadMedida;
                
                return (
                  <div key={d.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                    <div>
                      <span className="text-xs font-bold bg-primary-100 text-primary-700 px-2 py-1 rounded mr-2">{tipo}</span>
                      <span translate="no" lang="zxx" className="font-medium text-gray-900">{nombreItem}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{d.cantidad} {unidad} x ${d.precio}</p>
                      <p className="font-bold text-gray-900">${d.subtotal.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => triggerPrint(null, { selector: '.receipt-print' })} className="btn-secondary flex items-center gap-2">
                <Printer size={18} />
                Imprimir Comprobante
              </button>
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">Cerrar Detalle</button>
            </div>
            </div>
            {/* Componente para impresión */}
            <PrintReceipt type="COMPRA" data={selectedCompra} user={user} role={user?.role} />
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[95vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Registrar Nueva Compra</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Proveedor *</label>
                  <select className="input w-full" required value={compraData.proveedorId} onChange={e => setCompraData({...compraData, proveedorId: e.target.value})}>
                    <option value="">Seleccione proveedor...</option>
                    {proveedores.filter(p => p.estado).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  {proveedores.filter(p => p.estado).length === 0 && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg mt-2">
                      <p className="text-sm font-bold text-red-600">No hay proveedores activos disponibles.</p>
                      <p className="text-xs text-red-500">Registre o active un proveedor primero.</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Nº Factura / Comprobante (Opcional)</label>
                  <input type="text" className="input w-full" value={compraData.numeroFactura} onChange={e => setCompraData({...compraData, numeroFactura: e.target.value})} placeholder="Ej: F001-00001234" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Observación (Opcional)</label>
                  <textarea className="input w-full min-h-[60px]" value={compraData.observacion} onChange={e => setCompraData({...compraData, observacion: e.target.value})} placeholder="Notas adicionales sobre la recepción..."></textarea>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h4 className="font-bold text-gray-800">Detalles de Factura</h4>
                  <button type="button" onClick={handleAddDetalle} className="text-primary-600 hover:text-primary-800 text-sm font-bold flex items-center gap-1">
                    <Plus size={16} /> Agregar Fila
                  </button>
                </div>

                <div className="space-y-3">
                  {compraData.detalles.map((d, index) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white relative">
                      <div className="w-1/5">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Tipo</label>
                        <select className="input !py-2" value={d.tipo} onChange={e => handleDetalleChange(d.id, 'tipo', e.target.value)}>
                          <option value="alimento">Alimento</option>
                          <option value="medicamento">Medicamento</option>
                        </select>
                      </div>
                      
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Insumo</label>
                        <select className="input !py-2" required value={d.itemId} onChange={e => handleDetalleChange(d.id, 'itemId', e.target.value)}>
                          <option value="">Seleccione...</option>
                          {d.tipo === 'alimento' 
                            ? (alimentos.length > 0 ? alimentos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>) : <option disabled>Sin alimentos activos</option>)
                            : (medicamentos.length > 0 ? medicamentos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>) : <option disabled>Sin medicamentos activos</option>)
                          }
                        </select>
                      </div>

                      <div className="w-24">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Cant.</label>
                        <input type="number" step="0.01" min="0.01" className="input !py-2" required value={d.cantidad} onChange={e => handleDetalleChange(d.id, 'cantidad', e.target.value)} />
                      </div>

                      <div className="w-32">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Costo Unit.</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input type="number" step="0.01" min="0.01" className="input !py-2 pl-7" required value={d.precio} onChange={e => handleDetalleChange(d.id, 'precio', e.target.value)} />
                        </div>
                      </div>

                      <div className="w-32 text-right pt-5">
                        <p className="font-bold text-gray-800">
                          ${ ((parseFloat(d.cantidad) || 0) * (parseFloat(d.precio) || 0)).toLocaleString() }
                        </p>
                      </div>

                      <div className="pt-5 pl-2">
                        {compraData.detalles.length > 1 && (
                          <button type="button" onClick={() => handleRemoveDetalle(d.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Quitar fila">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-6 mt-4">
                <div className="text-lg">
                  Total General: <span className="font-bold text-red-600 text-3xl ml-2">${totalCalculado.toLocaleString()}</span>
                </div>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary px-8">Cancelar</button>
                  <button 
                    type="submit" 
                    className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                    disabled={submitLoading || proveedores.filter(p => p.estado).length === 0 || compraData.detalles.some(d => parseFloat(d.precio) <= 0 || parseFloat(d.cantidad) <= 0 || !d.precio || !d.cantidad || !d.itemId)}
                  >
                    {submitLoading ? 'Procesando...' : 'Procesar Factura'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProveedorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{selectedProveedor ? 'Editar' : 'Nuevo'} Proveedor</h3>
            <form onSubmit={handleProveedorSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre *</label>
                <input className="input" required value={proveedorData.nombre} onChange={e => setProveedorData({...proveedorData, nombre: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono</label>
                <input className="input" value={proveedorData.telefono} onChange={e => setProveedorData({...proveedorData, telefono: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Dirección</label>
                <textarea className="input min-h-[80px]" value={proveedorData.direccion} onChange={e => setProveedorData({...proveedorData, direccion: e.target.value})} />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowProveedorModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" disabled={providerSaving} className="btn-primary flex-1">
                  {providerSaving ? 'Guardando...' : 'Guardar'}
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

export default Compras;
