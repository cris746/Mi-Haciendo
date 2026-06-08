import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Edit2, Power, MapPin, History, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const Movimientos = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('parcelas');
  const [parcelas, setParcelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedParcela, setSelectedParcela] = useState(null);

  const initialForm = { nombre: '', tamano: '', imagen: '' };
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');

  // Animal & Movements State
  const [animales, setAnimales] = useState([]);
  const [loadingAnimales, setLoadingAnimales] = useState(false);
  const [searchAnimal, setSearchAnimal] = useState('');
  const [filterUbicacion, setFilterUbicacion] = useState('ALL');

  // Move Modal State
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const initialMoveForm = { parcelaId: '', fechaIngreso: new Date().toISOString().split('T')[0], observacion: '' };
  const [moveForm, setMoveForm] = useState(initialMoveForm);
  const [moveError, setMoveError] = useState('');

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [animalHistory, setAnimalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'parcelas') {
      fetchParcelas();
    } else if (activeTab === 'movimientos') {
      fetchAnimales();
      if (parcelas.length === 0) fetchParcelas();
    }
  }, [activeTab]);

  const fetchParcelas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/movimientos/parcelas?includeInactive=true');
      setParcelas(res.data);
    } catch (error) {
      console.error(error);
      alert('Error al cargar las parcelas');
    } finally {
      setLoading(false);
    }
  };

  const filteredParcelas = parcelas.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterMode === 'ACTIVE') return p.estado && matchesSearch;
    if (filterMode === 'INACTIVE') return !p.estado && matchesSearch;
    return matchesSearch;
  });

  const openCreateModal = () => {
    setModalMode('create');
    setFormData(initialForm);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (parcela) => {
    setModalMode('edit');
    setSelectedParcela(parcela);
    setFormData({
      nombre: parcela.nombre,
      tamano: parcela.tamano ?? '',
      imagen: parcela.imagen || ''
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      nombre: formData.nombre,
      tamano: formData.tamano !== '' ? parseFloat(formData.tamano) : null,
      imagen: formData.imagen || null
    };

    if (payload.tamano !== null && payload.tamano < 0) {
      return setError('El tamaño debe ser un número positivo.');
    }

    try {
      if (modalMode === 'create') {
        await api.post('/movimientos/parcelas', payload);
      } else {
        await api.put(`/movimientos/parcelas/${selectedParcela.id}`, payload);
      }
      setShowModal(false);
      fetchParcelas();
    } catch (error) {
      setError(error.response?.data?.error || 'Error al guardar la parcela');
    }
  };

  const handleStatusChange = async (parcela) => {
    const action = parcela.estado ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Seguro que deseas ${action} la parcela '${parcela.nombre}'?`)) return;
    
    try {
      await api.patch(`/movimientos/parcelas/${parcela.id}/estado`);
      fetchParcelas();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cambiar el estado de la parcela');
    }
  };

  const fetchAnimales = async () => {
    setLoadingAnimales(true);
    try {
      const res = await api.get('/movimientos/animales-ubicacion');
      setAnimales(res.data);
    } catch (error) {
      console.error(error);
      alert('Error al cargar los animales');
    } finally {
      setLoadingAnimales(false);
    }
  };

  const filteredAnimales = animales.filter(a => {
    const matchesSearch = a.nombre.toLowerCase().includes(searchAnimal.toLowerCase()) || 
                          a.nroArete.toLowerCase().includes(searchAnimal.toLowerCase());
    
    if (filterUbicacion === 'SIN_UBICACION') {
      return !a.ubicacionActual && matchesSearch;
    }
    if (filterUbicacion !== 'ALL') {
      return a.ubicacionActual?.parcelaId === parseInt(filterUbicacion) && matchesSearch;
    }
    return matchesSearch;
  });

  const openMoveModal = (animal) => {
    setSelectedAnimal(animal);
    setMoveForm({
      ...initialMoveForm,
      observacion: !animal.ubicacionActual && animal.origen === 'COMPRADO' 
        ? 'Ingreso posterior a parcela tras periodo de cuarentena.'
        : ''
    });
    setMoveError('');
    setShowMoveModal(true);
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    setMoveError('');

    if (!moveForm.parcelaId) {
      return setMoveError('Debe seleccionar una parcela.');
    }
    
    if (selectedAnimal.ubicacionActual?.parcelaId === parseInt(moveForm.parcelaId)) {
      return setMoveError('El animal ya se encuentra en esa parcela.');
    }

    if (selectedAnimal.origen === 'COMPRADO' && moveForm.fechaIngreso && selectedAnimal.fechaIngreso) {
      const fechaCompraStr = new Date(selectedAnimal.fechaIngreso).toISOString().split('T')[0];
      if (moveForm.fechaIngreso < fechaCompraStr) {
        return setMoveError('La fecha de ingreso a parcela no puede ser anterior a la fecha de compra/ingreso del animal.');
      }
    }

    try {
      const payload = {
        animalId: selectedAnimal.id,
        fechaIngreso: moveForm.fechaIngreso,
        observacion: moveForm.observacion
      };

      if (selectedAnimal.ubicacionActual) {
        payload.nuevaParcelaId = moveForm.parcelaId;
        await api.post('/movimientos/movimientos/transferir', payload);
      } else {
        payload.parcelaId = moveForm.parcelaId;
        await api.post('/movimientos/movimientos', payload);
      }
      
      setShowMoveModal(false);
      fetchAnimales();
    } catch (error) {
      setMoveError(error.response?.data?.error || 'Error al guardar el movimiento');
    }
  };

  const openHistoryModal = async (animal) => {
    setSelectedAnimal(animal);
    setAnimalHistory([]);
    setLoadingHistory(true);
    setShowHistoryModal(true);

    try {
      const res = await api.get(`/movimientos/movimientos/${animal.id}`);
      setAnimalHistory(res.data);
    } catch (error) {
      console.error(error);
      alert('Error al cargar el historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500 font-bold">No tienes permisos para ver esta sección.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ubicación y Parcelas</h2>
          <p className="text-gray-500">Gestión de potreros y ubicación del ganado</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('parcelas')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'parcelas' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Parcelas / Potreros
        </button>
        <button
          onClick={() => setActiveTab('movimientos')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'movimientos' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Movimientos
        </button>
      </div>

      {/* Tab Content: Movimientos */}
      {activeTab === 'movimientos' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-1 gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="Buscar por nombre o arete..."
                className="input flex-1 max-w-xs"
                value={searchAnimal}
                onChange={(e) => setSearchAnimal(e.target.value)}
              />
              <select
                className="input max-w-[200px]"
                value={filterUbicacion}
                onChange={(e) => setFilterUbicacion(e.target.value)}
              >
                <option value="ALL">Todas las ubicaciones</option>
                <option value="SIN_UBICACION">Sin ubicación</option>
                {parcelas.filter(p => p.estado).map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card overflow-x-auto p-0">
            {loadingAnimales ? (
              <div className="py-12">
                <LoadingSpinner text="Cargando ganado disponible..." />
              </div>
            ) : filteredAnimales.length === 0 ? (
              <div className="py-12">
                <EmptyState 
                  title={animales.length === 0 ? "Sin animales" : "Sin resultados"}
                  message={animales.length === 0 
                    ? "No hay animales activos registrados para mover." 
                    : "No se encontraron animales que coincidan con la búsqueda."}
                />
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Arete</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Animal</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Sexo</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Ubicación actual</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado ubicación</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAnimales.map((animal) => (
                    <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">{animal.nroArete}</td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {animal.nombre}
                        {animal.origen === 'COMPRADO' && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">COMPRADO</span>
                        )}
                        {animal.origen === 'NACIDO' && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-700">NACIDO</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{animal.sexo}</td>
                      <td className="px-6 py-4">
                        {animal.ubicacionActual ? (
                          <div className="flex items-center text-blue-700 font-medium">
                            <MapPin size={16} className="mr-2" />
                            {animal.ubicacionActual.parcelaNombre}
                          </div>
                        ) : animal.origen === 'COMPRADO' ? (
                          <span className="text-yellow-600 font-medium">Pendiente de ingreso</span>
                        ) : (
                          <span className="text-gray-400 italic">Sin ubicación asignada</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {animal.ubicacionActual ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">ASIGNADO</span>
                        ) : animal.origen === 'COMPRADO' ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">EN CUARENTENA</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">PENDIENTE</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex justify-center space-x-2">
                        <button onClick={() => openMoveModal(animal)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title={animal.ubicacionActual ? "Transferir" : "Asignar Ubicación"}>
                          <ArrowRight size={18} />
                        </button>
                        <button onClick={() => openHistoryModal(animal)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Ver Historial">
                          <History size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Parcelas */}
      {activeTab === 'parcelas' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-1 gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="Buscar parcela..."
                className="input flex-1 max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="input max-w-[150px]"
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </div>
            <button onClick={openCreateModal} className="btn-primary whitespace-nowrap w-full md:w-auto">
              Nueva Parcela
            </button>
          </div>

          <div className="card overflow-x-auto p-0">
            {loading ? (
              <div className="py-12">
                <LoadingSpinner text="Cargando parcelas y potreros..." />
              </div>
            ) : filteredParcelas.length === 0 ? (
              <div className="py-12">
                <EmptyState 
                  title={parcelas.length === 0 ? "Sin parcelas" : "Sin resultados"}
                  message={parcelas.length === 0 
                    ? "Registra tu primera parcela para comenzar a organizar tu ganado." 
                    : "No se encontraron parcelas que coincidan con los filtros."}
                />
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Tamaño (ha)</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredParcelas.map((parcela) => (
                    <tr key={parcela.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">{parcela.nombre}</td>
                      <td className="px-6 py-4 text-gray-600">{parcela.tamano ? `${parcela.tamano} ha` : '-'}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${parcela.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {parcela.estado ? 'ACTIVO' : 'INACTIVO'}
                         </span>
                      </td>
                      <td className="px-6 py-4 flex justify-center space-x-2">
                        <button onClick={() => openEditModal(parcela)} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleStatusChange(parcela)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title={parcela.estado ? "Desactivar" : "Reactivar"}>
                          <Power size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal CRUD Parcela */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{modalMode === 'create' ? 'Crear Parcela' : 'Editar Parcela'}</h3>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre de la Parcela *</label>
                <input 
                  type="text" 
                  required 
                  className="input w-full" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej. Potrero Norte"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Tamaño (hectáreas)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  className="input w-full" 
                  value={formData.tamano} 
                  onChange={e => setFormData({...formData, tamano: e.target.value})} 
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">URL de Imagen</label>
                <input 
                  type="url" 
                  className="input w-full" 
                  value={formData.imagen} 
                  onChange={e => setFormData({...formData, imagen: e.target.value})} 
                  placeholder="Opcional"
                />
              </div>

              <div className="flex space-x-3 pt-6 border-t mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">{modalMode === 'create' ? 'Crear' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mover/Asignar Animal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">
              {selectedAnimal?.ubicacionActual ? 'Transferir Animal' : (selectedAnimal?.origen === 'COMPRADO' ? 'Registrar Ingreso Físico' : 'Asignar Ubicación')}
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              Animal: <span className="font-bold text-gray-800">{selectedAnimal?.nombre} ({selectedAnimal?.nroArete})</span>
              {selectedAnimal?.ubicacionActual && (
                <span className="block mt-1">Ubicación actual: <span className="font-semibold text-blue-600">{selectedAnimal.ubicacionActual.parcelaNombre}</span></span>
              )}
            </p>
            
            {moveError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{moveError}</div>}
            
            <form onSubmit={handleMoveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Parcela Destino *</label>
                <select 
                  required 
                  className="input w-full" 
                  value={moveForm.parcelaId} 
                  onChange={e => setMoveForm({...moveForm, parcelaId: e.target.value})}
                >
                  <option value="">Seleccione una parcela...</option>
                  {parcelas.filter(p => p.estado).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha de Movimiento *</label>
                <input 
                  type="date" 
                  required
                  className="input w-full" 
                  value={moveForm.fechaIngreso} 
                  onChange={e => setMoveForm({...moveForm, fechaIngreso: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Observación</label>
                <textarea 
                  className="input w-full" 
                  rows="3"
                  value={moveForm.observacion} 
                  onChange={e => setMoveForm({...moveForm, observacion: e.target.value})} 
                  placeholder="Detalles adicionales del movimiento..."
                />
              </div>

              <div className="flex space-x-3 pt-6 border-t mt-6">
                <button type="button" onClick={() => setShowMoveModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">
                  {selectedAnimal?.ubicacionActual ? 'Transferir Animal' : (selectedAnimal?.origen === 'COMPRADO' ? 'Registrar Ingreso' : 'Asignar Ubicación')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-bold mb-2">Historial de Movimientos</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Animal: <span className="font-bold text-gray-800">{selectedAnimal?.nombre} ({selectedAnimal?.nroArete})</span>
            </p>
            
            <div className="flex-1 overflow-y-auto pr-2">
              {loadingHistory ? (
                <div className="py-8">
                  <LoadingSpinner text="Consultando historial..." />
                </div>
              ) : animalHistory.length === 0 ? (
                <div className="py-8">
                  <EmptyState 
                    title="Sin historial"
                    message="Este animal aún no tiene registros de movimientos entre parcelas."
                    compact={true}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {animalHistory.map((mov) => (
                    <div key={mov.id} className="relative pl-6 pb-6 border-l-2 border-blue-200 last:border-0 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500"></div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-800 flex items-center">
                            <MapPin size={16} className="mr-1 text-blue-500" />
                            {mov.parcela?.nombre}
                          </h4>
                          {!mov.fechaSalida && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Actual</span>
                          )}
                          {mov.fechaSalida && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">Finalizado</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <span className="font-semibold block text-xs text-gray-400">Fecha Ingreso:</span>
                            {new Date(mov.fechaIngreso).toLocaleDateString()}
                          </div>
                          {mov.fechaSalida && (
                            <div>
                              <span className="font-semibold block text-xs text-gray-400">Fecha Salida:</span>
                              {new Date(mov.fechaSalida).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {mov.observacion && (
                          <div className="mt-3 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">
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

            <div className="pt-6 border-t mt-4 text-right">
              <button onClick={() => setShowHistoryModal(false)} className="btn-secondary">Cerrar Historial</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movimientos;
