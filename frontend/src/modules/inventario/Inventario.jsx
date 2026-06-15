import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Edit2, Power, Plus, Utensils, History, LayoutDashboard } from 'lucide-react';
import MovimientosInventarioTab from './MovimientosInventarioTab';
import ResumenInventarioTab from './ResumenInventarioTab';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const Inventario = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isVet = user?.role === 'VETERINARIO';

  const [activeTab, setActiveTab] = useState('resumen');
  const [alimentos, setAlimentos] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  // Estados para nuevos modales UX
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', variant: 'danger', confirmText: '', onConfirm: () => {} });
  const [modalLoading, setModalLoading] = useState(false);

  const [feedData, setFeedData] = useState({
    animalId: '',
    alimentoId: '',
    cantidad: '',
    observacion: ''
  });

  const initialItemState = {
    nombre: '',
    descripcion: '',
    stockCantidad: '',
    unidadMedida: '',
    fechaVencimiento: '',
    precioCompra: '',
    // nuevos campos
    codigo: '',
    presentacion: '',
    unidadCompra: '',
    contenidoPorUnidad: '',
    unidadBase: '',
    stockUnidades: '',
    stockTotalBase: '',
    precioCompraUnidad: '',
    lote: ''
  };
  const [itemData, setItemData] = useState(initialItemState);
  const [selectedItem, setSelectedItem] = useState(null);

  // Calcula automáticamente el stock base
  useEffect(() => {
    if (activeTab === 'medicamentos' && itemData.stockUnidades !== '' && itemData.contenidoPorUnidad !== '') {
      const su = parseFloat(itemData.stockUnidades);
      const cu = parseFloat(itemData.contenidoPorUnidad);
      if (!isNaN(su) && !isNaN(cu)) {
        setItemData(prev => ({ ...prev, stockTotalBase: su * cu }));
      }
    }
  }, [itemData.stockUnidades, itemData.contenidoPorUnidad, activeTab]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAlim, resMed, resAnim] = await Promise.all([
        api.get('/alimentos'),
        api.get('/medicamentos'),
        api.get('/animals')
      ]);
      setAlimentos(resAlim.data);
      setMedicamentos(resMed.data);
      setAnimales(resAnim.data.filter(a => a.estado && !a.vendido));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeding = async (e) => {
    e.preventDefault();
    try {
      await api.post('/alimentacion', { 
         ...feedData, 
         cantidad: parseFloat(feedData.cantidad) 
      });
      setShowFeedModal(false);
      setFeedData({ animalId: '', alimentoId: '', cantidad: '', observacion: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al registrar alimentación');
    }
  };

  const openItemModal = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setItemData({
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        stockCantidad: item.stockCantidad,
        unidadMedida: item.unidadMedida || '',
        fechaVencimiento: item.fechaVencimiento ? new Date(item.fechaVencimiento).toISOString().split('T')[0] : '',
        precioCompra: item.precioCompra || '',
        codigo: item.codigo || '',
        presentacion: item.presentacion || '',
        unidadCompra: item.unidadCompra || '',
        contenidoPorUnidad: item.contenidoPorUnidad || '',
        unidadBase: item.unidadBase || '',
        stockUnidades: item.stockUnidades || '',
        stockTotalBase: item.stockTotalBase || '',
        precioCompraUnidad: item.precioCompraUnidad || '',
        lote: item.lote || ''
      });
    } else {
      setSelectedItem(null);
      setItemData(initialItemState);
    }
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const isAlimento = activeTab === 'alimentos';
    const endpoint = isAlimento ? '/alimentos' : '/medicamentos';
    
    try {
      if (selectedItem) {
        await api.put(`${endpoint}/${selectedItem.id}`, itemData);
      } else {
        await api.post(endpoint, itemData);
      }
      setShowItemModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || `Error al guardar ${isAlimento ? 'alimento' : 'medicamento'}`);
    }
  };

  const handleStatusChange = (id, estadoActual) => {
    const isAlimento = activeTab === 'alimentos';
    const item = (isAlimento ? alimentos : medicamentos).find(i => i.id === id);
    const isActivating = !item.estado;

    setConfirmModal({
      isOpen: true,
      title: isActivating ? 'Reactivar insumo' : 'Desactivar insumo',
      message: isActivating
        ? `¿Seguro que deseas reactivar "${item.nombre}"? Volverá a estar disponible para nuevas operaciones.`
        : `¿Seguro que deseas desactivar "${item.nombre}"? El insumo dejará de estar disponible para nuevas operaciones, pero se conservará su historial.`,
      variant: isActivating ? 'success' : 'danger',
      confirmText: isActivating ? 'Reactivar' : 'Desactivar',
      onConfirm: async () => {
        setModalLoading(true);
        const endpoint = isAlimento ? `/alimentos/${id}/estado` : `/medicamentos/${id}/estado`;
        try {
          await api.patch(endpoint);
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

  if (loading) return <LoadingSpinner text="Cargando inventario..." />;

  const currentList = activeTab === 'alimentos' ? alimentos : medicamentos;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventario General</h2>
          <p className="text-gray-500">Gestión de recursos, alimentos y medicamentos</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'alimentos' && (isAdmin || isVet) && (
            <button onClick={() => setShowFeedModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <Utensils size={18} />
              Suministrar
            </button>
          )}
          {activeTab !== 'movimientos' && activeTab !== 'resumen' && isAdmin && (
            <button onClick={() => openItemModal()} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={18} />
              Registrar {activeTab === 'alimentos' ? 'Alimento' : 'Medicamento'}
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'resumen' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('resumen')}
        >
          <LayoutDashboard size={16} />
          Resumen
        </button>
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'alimentos' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('alimentos')}
        >
          Alimentos
        </button>
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'medicamentos' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('medicamentos')}
        >
          Medicamentos
        </button>
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'movimientos' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('movimientos')}
        >
          <History size={16} />
          Movimientos
        </button>
      </div>

      {activeTab === 'resumen' ? (
        <ResumenInventarioTab />
      ) : activeTab === 'movimientos' ? (
        <MovimientosInventarioTab />
      ) : activeTab === 'medicamentos' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 min-w-[800px]">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Medicamento</th>
                <th className="px-4 py-3">Presentación</th>
                <th className="px-4 py-3">Stock Físico</th>
                <th className="px-4 py-3">Stock Base</th>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Estado</th>
                {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {medicamentos.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-10 text-center">
                    <EmptyState 
                      title="No hay medicamentos registrados"
                      message="Registra medicamentos para controlar stock, vencimientos y aplicaciones sanitarias."
                    />
                  </td>
                </tr>
              ) : medicamentos.map(item => (
                <tr key={item.id} className={`border-b hover:bg-gray-50 ${!item.estado ? 'bg-gray-50 opacity-60 grayscale-[0.5]' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.codigo || '-'}</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{item.nombre}</td>
                  <td className="px-4 py-3">{item.presentacion || '-'}</td>
                  <td className="px-4 py-3 font-medium text-primary-600">
                    {item.stockUnidades !== null && item.unidadCompra ? `${item.stockUnidades} ${item.unidadCompra}` : `${item.stockCantidad} ${item.unidadMedida}`}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.stockTotalBase !== null && item.unidadBase ? `${item.stockTotalBase} ${item.unidadBase}` : `${item.stockCantidad} ${item.unidadMedida}`}
                  </td>
                  <td className="px-4 py-3">{item.lote || '-'}</td>
                  <td className="px-4 py-3">
                    {item.fechaVencimiento ? new Date(item.fechaVencimiento).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 flex justify-end space-x-2">
                      <button onClick={() => openItemModal(item)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleStatusChange(item.id, item.estado)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title={item.estado ? 'Desactivar/Eliminar' : 'Reactivar'}>
                        <Power size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alimentos.map((item) => (
            <div key={item.id} className={`card relative overflow-hidden group transition-all duration-300 ${!item.estado ? 'opacity-60 bg-gray-100 grayscale-[0.5]' : 'hover:shadow-lg'}`}>
               <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${!item.estado ? 'hidden' : ''}`}>
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
               </div>
               
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h4 translate="no" lang="zxx" className="text-lg font-bold text-gray-800 pr-8">{item.nombre}</h4>
                   {item.descripcion && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.descripcion}</p>}
                 </div>
                 <div className="flex flex-col items-end gap-1">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${item.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                     {item.estado ? 'Activo' : 'Inactivo'}
                   </span>
                   {item.fechaVencimiento && (() => {
                     const vDate = new Date(item.fechaVencimiento);
                     const today = new Date();
                     today.setHours(0,0,0,0);
                     const diffTime = vDate - today;
                     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                     
                     if (diffDays < 0) {
                       return <span className="px-2 py-1 rounded text-xs font-bold bg-red-600 text-white shadow-sm">Vencido</span>;
                     } else if (diffDays <= 30) {
                       return <span className="px-2 py-1 rounded text-xs font-bold bg-orange-500 text-white shadow-sm">Por vencer</span>;
                     } else {
                       return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 shadow-sm">Vigente</span>;
                     }
                   })()}
                 </div>
               </div>

               <div className="flex items-end justify-between mt-4">
                   <div>
                     <span className={`text-3xl font-extrabold ${!item.estado ? 'text-gray-400' : 'text-primary-600'}`}>{item.stockCantidad}</span>
                     <span className="text-sm text-gray-500 ml-1">{item.unidadMedida}</span>
                     {item.precioCompra && <div className="text-xs text-gray-400 font-medium mt-1">Precio: ${item.precioCompra}</div>}
                   </div>
                  <div className={`px-2 py-1 rounded-md text-xs font-bold ${!item.estado ? 'hidden' : (item.stockCantidad < 50 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')}`}>
                     {item.stockCantidad < 50 ? 'Stock Bajo' : 'Normal'}
                  </div>
               </div>

               {isAdmin && (
                 <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2 relative z-10">
                   <button onClick={() => openItemModal(item)} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Editar">
                     <Edit2 size={18} />
                   </button>
                   <button onClick={() => handleStatusChange(item.id, item.estado)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title={item.estado ? 'Desactivar/Eliminar' : 'Reactivar'}>
                     <Power size={18} />
                   </button>
                 </div>
               )}
            </div>
          ))}
          {alimentos.length === 0 && (
            <div className="col-span-full py-10">
              <EmptyState 
                title="No hay alimentos registrados"
                message="Registra alimentos para controlar el stock y las raciones de la hacienda." 
              />
            </div>
          )}
        </div>
      )}

      {showFeedModal && (() => {
        const selectedAlimento = alimentos.find(a => a.id === parseInt(feedData.alimentoId));
        const stockDisponible = selectedAlimento?.stockCantidad || 0;
        const cantidadIngresada = parseFloat(feedData.cantidad) || 0;
        const isExcessive = cantidadIngresada > stockDisponible;
        const canSubmit = feedData.animalId && feedData.alimentoId && cantidadIngresada > 0 && !isExcessive;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-6">Suministrar Alimento</h3>
              <form onSubmit={handleFeeding} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Seleccionar Animal</label>
                  <select className="input" required value={feedData.animalId} onChange={e => setFeedData({...feedData, animalId: e.target.value})}>
                    <option value="">Seleccione un animal...</option>
                    {animales.map(a => <option key={a.id} value={a.id}>{a.nroArete} - {a.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Seleccionar Alimento</label>
                  <select className="input" required value={feedData.alimentoId} onChange={e => setFeedData({...feedData, alimentoId: e.target.value})}>
                    <option value="">Seleccione un alimento...</option>
                    {alimentos
                      .filter(a => {
                        const vDate = a.fechaVencimiento ? new Date(a.fechaVencimiento) : null;
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const isExpired = vDate && vDate < today;
                        return a.estado && a.stockCantidad > 0 && !isExpired;
                      })
                      .map(al => (
                        <option key={al.id} value={al.id}>
                          {al.nombre} — Stock: {al.stockCantidad} {al.unidadMedida}
                        </option>
                      ))
                    }
                  </select>
                  {alimentos.filter(a => a.estado && a.stockCantidad > 0 && (!a.fechaVencimiento || new Date(a.fechaVencimiento) >= new Date().setHours(0,0,0,0))).length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No hay alimentos aptos para suministrar.</p>
                  )}
                </div>

                {selectedAlimento && (
                  <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1">
                    <p><strong>Stock disponible:</strong> {selectedAlimento.stockCantidad} {selectedAlimento.unidadMedida}</p>
                    {selectedAlimento.fechaVencimiento && <p><strong>Vencimiento:</strong> {new Date(selectedAlimento.fechaVencimiento).toLocaleDateString()}</p>}
                    {selectedAlimento.descripcion && <p className="text-xs text-gray-600 italic">{selectedAlimento.descripcion}</p>}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Cantidad a suministrar ({selectedAlimento?.unidadMedida || 'und'})</label>
                  <input type="number" step="0.01" min="0" className={`input ${isExcessive ? 'border-red-500 focus:ring-red-500' : ''}`} required value={feedData.cantidad} onChange={e => setFeedData({...feedData, cantidad: e.target.value})} />
                  {isExcessive && (
                    <p className="text-xs text-red-600 mt-1 font-bold">La cantidad no puede superar el stock disponible.</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Observación (opcional)</label>
                  <textarea 
                    className="input min-h-[80px]" 
                    value={feedData.observacion} 
                    onChange={e => setFeedData({...feedData, observacion: e.target.value})}
                    placeholder="Detalles del suministro..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setShowFeedModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                  <button type="submit" disabled={!canSubmit} className={`flex-1 ${canSubmit ? 'btn-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed py-2 px-4 rounded-xl font-bold font-montserrat transition-all duration-300'}`}>
                    Registrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`bg-white rounded-2xl p-8 w-full shadow-2xl my-8 ${activeTab === 'medicamentos' ? 'max-w-2xl' : 'max-w-md'}`}>
            <h3 className="text-xl font-bold mb-6">
              {selectedItem ? 'Editar' : 'Registrar'} {activeTab === 'alimentos' ? 'Alimento' : 'Medicamento'}
            </h3>
            <form onSubmit={handleItemSubmit} className="space-y-6">
              {activeTab === 'medicamentos' ? (
                <>
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 border-b pb-1">SECCIÓN 1: Datos del Medicamento</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre del medicamento *</label>
                        <input className="input" required value={itemData.nombre} onChange={e => setItemData({...itemData, nombre: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Código</label>
                        <input className="input" value={itemData.codigo} onChange={e => setItemData({...itemData, codigo: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Lote</label>
                        <input className="input" value={itemData.lote} onChange={e => setItemData({...itemData, lote: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha de vencimiento</label>
                        <input type="date" className="input" value={itemData.fechaVencimiento} onChange={e => setItemData({...itemData, fechaVencimiento: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Descripción</label>
                        <input className="input" value={itemData.descripcion} onChange={e => setItemData({...itemData, descripcion: e.target.value})} placeholder="Uso, indicaciones..." />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 border-b pb-1">SECCIÓN 2: Presentación</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Presentación</label>
                        <input className="input" placeholder="ej. Frasco 30ML" value={itemData.presentacion} onChange={e => setItemData({...itemData, presentacion: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Unidad de compra</label>
                        <input className="input" placeholder="ej. Frasco, Caja" value={itemData.unidadCompra} onChange={e => setItemData({...itemData, unidadCompra: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Contenido por unidad</label>
                        <input type="number" step="0.01" min="0" className="input" placeholder="ej. 30" value={itemData.contenidoPorUnidad} onChange={e => setItemData({...itemData, contenidoPorUnidad: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Unidad base</label>
                        <input className="input" placeholder="ej. ML, MG" value={itemData.unidadBase} onChange={e => setItemData({...itemData, unidadBase: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 border-b pb-1">SECCIÓN 3: Inventario Inicial</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Stock inicial en unidades</label>
                        <input type="number" step="0.01" min="0" className="input" placeholder="ej. 5" value={itemData.stockUnidades} onChange={e => setItemData({...itemData, stockUnidades: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Precio de compra por unidad</label>
                        <input type="number" step="0.01" min="0" className="input" placeholder="ej. 18.50" value={itemData.precioCompraUnidad} onChange={e => setItemData({...itemData, precioCompraUnidad: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Stock total base calculado automáticamente</label>
                        <input type="text" className="input bg-gray-100 cursor-not-allowed font-medium text-primary-600" readOnly value={itemData.stockTotalBase !== '' && itemData.unidadBase ? `${itemData.stockTotalBase} ${itemData.unidadBase}` : (itemData.stockTotalBase !== '' ? itemData.stockTotalBase : '')} placeholder="Calculado al llenar unidades y contenido" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre *</label>
                    <input className="input" required value={itemData.nombre} onChange={e => setItemData({...itemData, nombre: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Descripción</label>
                    <input className="input" value={itemData.descripcion} onChange={e => setItemData({...itemData, descripcion: e.target.value})} placeholder="Uso, indicaciones..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Stock Actual *</label>
                      <input type="number" step="0.01" min="0" className="input" required value={itemData.stockCantidad} onChange={e => setItemData({...itemData, stockCantidad: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Unidad de Medida *</label>
                      <input className="input" required placeholder="ej. kg, sacos" value={itemData.unidadMedida} onChange={e => setItemData({...itemData, unidadMedida: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha Vencimiento</label>
                      <input type="date" className="input" value={itemData.fechaVencimiento} onChange={e => setItemData({...itemData, fechaVencimiento: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Precio Compra ($)</label>
                      <input type="number" step="0.01" min="0" className="input" value={itemData.precioCompra} onChange={e => setItemData({...itemData, precioCompra: e.target.value})} placeholder="0.00" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación UX */}
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
    </div>
  );
};

export default Inventario;
