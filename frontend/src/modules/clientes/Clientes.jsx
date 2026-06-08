import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Eye, Edit2, Power } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Clientes = () => {
  const { user } = useAuth();
  const isAdminOrVendedor = user?.role === 'ADMIN' || user?.role === 'VENDEDOR';

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedCliente, setSelectedCliente] = useState(null);

  const initialFormState = {
    nombre: '',
    telefono: '',
    direccion: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clientes');
      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData(initialFormState);
    setShowCreateModal(true);
  };

  const openEditModal = (cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (cliente) => {
    setSelectedCliente(cliente);
    setShowViewModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clientes', formData);
      setShowCreateModal(false);
      fetchClientes();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear cliente');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/clientes/${selectedCliente.id}`, formData);
      setShowEditModal(false);
      fetchClientes();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al actualizar cliente');
    }
  };

  const handleStatusChange = async (id) => {
    if (!window.confirm('¿Seguro que deseas cambiar el estado de este registro? (Activar / Desactivar)')) return;
    try {
      await api.patch(`/clientes/${id}/estado`);
      fetchClientes();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const renderFormFields = () => (
    <>
      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre *</label>
        <input className="input" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono</label>
        <input className="input" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Dirección</label>
        <textarea className="input" rows="2" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})}></textarea>
      </div>
    </>
  );

  if (loading) return <div className="text-center py-10">Cargando clientes...</div>;

  if (!isAdminOrVendedor) return <div className="text-center py-10">Acceso denegado</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Catálogo de Clientes</h2>
          <p className="text-gray-500">Gestión de cartera de clientes</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          Registrar Cliente
        </button>
      </div>

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
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                <td translate="no" lang="zxx" className="px-6 py-4 font-bold text-gray-900">{cliente.nombre}</td>
                <td translate="no" lang="zxx" className="px-6 py-4">{cliente.telefono || '-'}</td>
                <td translate="no" lang="zxx" className="px-6 py-4">{cliente.direccion || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${cliente.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {cliente.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center space-x-2">
                  <button onClick={() => openViewModal(cliente)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver Detalle">
                    <Eye size={18} />
                  </button>
                  <button onClick={() => openEditModal(cliente)} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Editar">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleStatusChange(cliente.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title={cliente.estado ? "Desactivar/Eliminar" : "Reactivar"}>
                    <Power size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No hay clientes registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Registrar Cliente</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {renderFormFields()}
              <div className="flex space-x-3 pt-4">
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
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Editar Cliente</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              {renderFormFields()}
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && selectedCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Detalle del Cliente</h3>
              <span className={`px-2 py-1 rounded text-xs font-bold ${selectedCliente.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {selectedCliente.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-semibold">Nombre:</span>
                <span translate="no" lang="zxx" className="font-bold text-gray-900">{selectedCliente.nombre}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-semibold">Teléfono:</span>
                <span translate="no" lang="zxx" className="font-bold text-gray-900">{selectedCliente.telefono || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-semibold">Dirección:</span>
                <span translate="no" lang="zxx" className="font-bold text-gray-900">{selectedCliente.direccion || '-'}</span>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={() => setShowViewModal(false)} className="w-full btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
