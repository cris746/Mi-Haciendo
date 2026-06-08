import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Edit2, Power, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Usuarios = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const initialFormState = {
    nombre: '',
    email: '',
    password: '',
    role: 'VENDEDOR'
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData(initialFormState);
    setShowPassword(false);
    setShowCreateModal(true);
  };

  const openEditModal = (usuario) => {
    setSelectedUser(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      role: usuario.role,
      password: '' // Optional for edit
    });
    setShowPassword(false);
    setShowEditModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData,
        email: formData.email.toLowerCase().trim()
      };
      await api.post('/usuarios', payload);
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData,
        email: formData.email.toLowerCase().trim()
      };
      if (!payload.password) delete payload.password;

      await api.put(`/usuarios/${selectedUser.id}`, payload);
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al actualizar usuario');
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Seguro que deseas ${action} a este usuario?`)) return;
    try {
      await api.patch(`/usuarios/${id}/estado`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const filteredUsuarios = usuarios.filter(u => {
    const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesStatus = statusFilter !== '' ? u.estado === (statusFilter === 'true') : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const renderFormFields = (isEdit = false) => (
    <>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre</label>
          <input className="input w-full" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Email</label>
          <input type="email" className="input w-full" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Contraseña {isEdit && '(Opcional)'}</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              className="input w-full pr-10" 
              required={!isEdit} 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Rol</label>
          <select className="input w-full" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
            <option value="ADMIN">Administrador</option>
            <option value="VETERINARIO">Veterinario</option>
            <option value="VENDEDOR">Vendedor</option>
          </select>
        </div>
      </div>
    </>
  );

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
        <p className="text-gray-500 mt-2">No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Control de Usuarios</h2>
          <p className="text-gray-500">Gestión de accesos y roles del sistema</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          Registrar Nuevo Usuario
        </button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Buscar por nombre o email..." 
          className="input flex-1"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select className="input w-full sm:w-48" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">Todos los Roles</option>
          <option value="ADMIN">Administrador</option>
          <option value="VETERINARIO">Veterinario</option>
          <option value="VENDEDOR">Vendedor</option>
        </select>
        <select className="input w-full sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos los Estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando usuarios...</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Rol</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">{u.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 
                          u.role === 'VETERINARIO' ? 'bg-blue-100 text-blue-700' : 
                          'bg-green-100 text-green-700'}`}>
                        {u.role}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`w-3 h-3 rounded-full inline-block mr-2 ${u.estado ? 'bg-green-500' : 'bg-red-500'}`}></span>
                     {u.estado ? 'Activo' : 'Inactivo'}
                  </td>
                  <td className="px-6 py-4 flex justify-center space-x-2">
                    <button onClick={() => openEditModal(u)} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Editar">
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleStatusChange(u.id, u.estado)} 
                      className={`p-2 rounded-lg ${u.estado ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' : 'text-red-500 hover:text-green-600 hover:bg-green-50'}`} 
                      title={u.estado ? "Desactivar" : "Activar"}
                    >
                      <Power size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsuarios.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No hay usuarios que coincidan con los filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Registrar Usuario</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {renderFormFields(false)}
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
            <h3 className="text-xl font-bold mb-6">Editar Usuario</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              {renderFormFields(true)}
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
