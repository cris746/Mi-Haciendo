import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Edit2, Power, Search, Plus } from 'lucide-react';

const Catalogos = () => {
  const [activeTab, setActiveTab] = useState('razas'); // 'razas' | 'categorias'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const initialFormState = { nombre: '', descripcion: '' };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Pedimos todas las entradas, incluyendo inactivas
      const endpoint = activeTab === 'razas' ? '/animals/razas' : '/animals/categorias';
      const response = await api.get(`${endpoint}?includeInactive=true`);
      setData(response.data);
    } catch (error) {
      console.error(error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData(initialFormState);
    setIsEdit(false);
    setSelectedItem(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || ''
    });
    setSelectedItem(item);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = activeTab === 'razas' ? '/animals/razas' : '/animals/categorias';
    
    try {
      if (isEdit) {
        await api.put(`${endpoint}/${selectedItem.id}`, formData);
      } else {
        await api.post(endpoint, formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al guardar');
    }
  };

  const handleStatusChange = async (id, currentState) => {
    const action = currentState ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Seguro que deseas ${action} este registro?`)) return;
    
    const endpoint = activeTab === 'razas' ? `/animals/razas/${id}/estado` : `/animals/categorias/${id}/estado`;
    try {
      await api.patch(endpoint);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.descripcion && item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === '' ? true : item.estado === (statusFilter === 'true');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Catálogos Ganaderos</h2>
          <p className="text-gray-500">Gestión de razas y categorías del sistema</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>Crear {activeTab === 'razas' ? 'Raza' : 'Categoría'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'razas'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => { setActiveTab('razas'); setSearchTerm(''); setStatusFilter(''); }}
        >
          Razas
        </button>
        <button
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'categorias'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => { setActiveTab('categorias'); setSearchTerm(''); setStatusFilter(''); }}
        >
          Categorías
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o descripción..." 
            className="input w-full pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="input w-full sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos los Estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10">Cargando datos...</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Descripción</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">{item.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">{item.descripcion || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold inline-block ${
                      item.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-center space-x-2">
                    <button 
                      onClick={() => openEditModal(item)} 
                      className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg" 
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleStatusChange(item.id, item.estado)} 
                      className={`p-2 rounded-lg ${
                        item.estado 
                          ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' 
                          : 'text-red-500 hover:text-green-600 hover:bg-green-50'
                      }`} 
                      title={item.estado ? "Desactivar" : "Activar"}
                    >
                      <Power size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No hay registros que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">
              {isEdit ? 'Editar' : 'Crear'} {activeTab === 'razas' ? 'Raza' : 'Categoría'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  required 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Descripción (Opcional)</label>
                <textarea 
                  className="input w-full h-24 resize-none" 
                  value={formData.descripcion} 
                  onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                ></textarea>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {isEdit ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalogos;
