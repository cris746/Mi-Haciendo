import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Eye, Edit2, Power } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const initialFormState = {
  nombre: '',
  telefono: '',
  direccion: ''
};

const Proveedores = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedProveedor, setSelectedProveedor] = useState(null);

  const [createFormData, setCreateFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState(initialFormState);

  const [tableVersion, setTableVersion] = useState(0);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const { data } = await api.get('/proveedores', {
        params: { t: Date.now() }
      });

      setProveedores(Array.isArray(data) ? data : []);
      setTableVersion(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Error al cargar proveedores');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData(initialFormState);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedProveedor(null);
    setEditFormData(initialFormState);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedProveedor(null);
  };

  const openCreateModal = () => {
    setCreateFormData(initialFormState);
    setShowCreateModal(true);
  };

  const openEditModal = (proveedor) => {
    setSelectedProveedor(proveedor);

    setEditFormData({
      nombre: proveedor.nombre || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || ''
    });

    setShowEditModal(true);
  };

  const openViewModal = (proveedor) => {
    setSelectedProveedor(proveedor);
    setShowViewModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const payload = {
      nombre: createFormData.nombre.trim(),
      telefono: createFormData.telefono.trim(),
      direccion: createFormData.direccion.trim()
    };

    if (!payload.nombre) {
      alert('El nombre del proveedor es obligatorio');
      return;
    }

    try {
      await api.post('/proveedores', payload);
      closeCreateModal();
      await fetchProveedores(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear proveedor');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    if (!selectedProveedor?.id) {
      alert('No se seleccionó ningún proveedor para editar');
      return;
    }

    const payload = {
      nombre: editFormData.nombre.trim(),
      telefono: editFormData.telefono.trim(),
      direccion: editFormData.direccion.trim()
    };

    if (!payload.nombre) {
      alert('El nombre del proveedor es obligatorio');
      return;
    }

    try {
      await api.put(`/proveedores/${selectedProveedor.id}`, payload);

      const { data } = await api.get('/proveedores', {
        params: {
          refresh: Date.now()
        }
      });

      setProveedores(Array.isArray(data) ? data : []);

      setShowEditModal(false);
      setSelectedProveedor(null);
      setEditFormData({
        nombre: '',
        telefono: '',
        direccion: ''
      });

      setTableVersion(prev => prev + 1);
    } catch (error) {
      alert(error.response?.data?.error || 'Error al actualizar proveedor');
    }
  };

  const handleStatusChange = async (id) => {
    if (!window.confirm('¿Seguro que deseas cambiar el estado de este registro? (Activar / Desactivar)')) return;

    try {
      await api.patch(`/proveedores/${id}/estado`);
      await fetchProveedores(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const renderCreateFormFields = () => (
    <>
      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre *</label>
        <input
          name="nombre"
          className="input"
          required
          value={createFormData.nombre}
          onChange={(e) =>
            setCreateFormData(prev => ({
              ...prev,
              nombre: e.target.value
            }))
          }
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono</label>
        <input
          name="telefono"
          className="input"
          value={createFormData.telefono}
          onChange={(e) =>
            setCreateFormData(prev => ({
              ...prev,
              telefono: e.target.value
            }))
          }
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Dirección</label>
        <textarea
          name="direccion"
          className="input"
          rows="2"
          value={createFormData.direccion}
          onChange={(e) =>
            setCreateFormData(prev => ({
              ...prev,
              direccion: e.target.value
            }))
          }
        />
      </div>
    </>
  );

  const renderEditFormFields = () => (
    <>
      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre *</label>
        <input
          name="nombre"
          className="input"
          required
          value={editFormData.nombre}
          onChange={(e) =>
            setEditFormData(prev => ({
              ...prev,
              nombre: e.target.value
            }))
          }
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono</label>
        <input
          name="telefono"
          className="input"
          value={editFormData.telefono}
          onChange={(e) =>
            setEditFormData(prev => ({
              ...prev,
              telefono: e.target.value
            }))
          }
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Dirección</label>
        <textarea
          name="direccion"
          className="input"
          rows="2"
          value={editFormData.direccion}
          onChange={(e) =>
            setEditFormData(prev => ({
              ...prev,
              direccion: e.target.value
            }))
          }
        />
      </div>
    </>
  );

  if (loading) {
    return <div className="text-center py-10">Cargando proveedores...</div>;
  }

  if (!isAdmin) {
    return <div className="text-center py-10">Acceso denegado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-red-600">
            Catálogo de Proveedores
          </h2>
          <p className="text-gray-500">Gestión de red de proveedores</p>
        </div>

        <button onClick={openCreateModal} className="btn-primary">
          Registrar Proveedor
        </button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table key={tableVersion} className="w-full text-left">
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
            {proveedores.map((proveedor) => (
              <tr
                key={`${proveedor.id}-${proveedor.nombre}-${tableVersion}`}
                className="hover:bg-gray-50 transition-colors"
              >
                <td translate="no" lang="zxx" className="px-6 py-4 font-mono font-semibold tracking-wide text-gray-900 whitespace-normal break-words">
                  {String(proveedor.nombre)}
                </td>

                <td translate="no" lang="zxx" className="px-6 py-4">
                  {proveedor.telefono || '-'}
                </td>

                <td translate="no" lang="zxx" className="px-6 py-4">
                  {proveedor.direccion || '-'}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${proveedor.estado
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}
                  >
                    {proveedor.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                <td className="px-6 py-4 flex justify-center space-x-2">
                  <button
                    onClick={() => openViewModal(proveedor)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Ver Detalle"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    onClick={() => openEditModal(proveedor)}
                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    onClick={() => handleStatusChange(proveedor.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title={proveedor.estado ? 'Desactivar/Eliminar' : 'Reactivar'}
                  >
                    <Power size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {proveedores.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No hay proveedores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Registrar Proveedor</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              {renderCreateFormFields()}

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={closeCreateModal} className="flex-1 btn-secondary">
                  Cancelar
                </button>

                <button type="submit" className="flex-1 btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedProveedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Editar Proveedor</h3>

            <form onSubmit={handleEdit} className="space-y-4">
              {renderEditFormFields()}

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={closeEditModal} className="flex-1 btn-secondary">
                  Cancelar
                </button>

                <button type="submit" className="flex-1 btn-primary">
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedProveedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Detalle del Proveedor</h3>

              <span
                className={`px-2 py-1 rounded text-xs font-bold ${selectedProveedor.estado
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                  }`}
              >
                {selectedProveedor.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-semibold">Nombre:</span>
                <span translate="no" lang="zxx" className="font-bold text-gray-900">
                  {selectedProveedor.nombre}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-semibold">Teléfono:</span>
                <span translate="no" lang="zxx" className="font-bold text-gray-900">
                  {selectedProveedor.telefono || '-'}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-semibold">Dirección:</span>
                <span translate="no" lang="zxx" className="font-bold text-gray-900">
                  {selectedProveedor.direccion || '-'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={closeViewModal} className="w-full btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;