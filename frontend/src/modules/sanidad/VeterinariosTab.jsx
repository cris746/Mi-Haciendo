import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = { nombre: '', telefono: '', email: '' };

const VeterinariosTab = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [vets, setVets]           = useState([]);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);

  useEffect(() => { fetchVets(); }, []);

  const fetchVets = async () => {
    try {
      const { data } = await api.get('/veterinarios');
      setVets(data);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/veterinarios/${editingId}`, form);
      } else {
        await api.post('/veterinarios', form);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      await fetchVets();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vet) => {
    setForm({ nombre: vet.nombre, telefono: vet.telefono || '', email: vet.email || '' });
    setEditingId(vet.id);
    setShowForm(true);
    setError('');
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/veterinarios/${id}/estado`);
      await fetchVets();
    } catch (e) { setError(e.response?.data?.error || 'Error al cambiar estado'); }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Veterinarios</h3>
          {!isAdmin && (
            <p className="text-xs text-gray-500 mt-1">Solo lectura. La gestión de veterinarios está reservada para administradores.</p>
          )}
        </div>
        {isAdmin && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2">
            + Nuevo Veterinario
          </button>
        )}
      </div>

      {showForm && (
        <div className="card border border-primary-200">
          <h4 className="text-sm font-bold text-gray-700 mb-4">
            {editingId ? 'Editar Veterinario' : 'Nuevo Veterinario'}
          </h4>
          {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input
                className="input"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Dr. García"
                required
              />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                className="input"
                value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                placeholder="0414-000-0000"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="vet@hacienda.com"
              />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary px-6 py-2 text-sm">
                {loading ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Veterinario'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary px-6 py-2 text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
              <th className="pb-3 pr-4">Nombre</th>
              <th className="pb-3 pr-4">Teléfono</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Tratamientos</th>
              <th className="pb-3 pr-4">Estado</th>
              {isAdmin && <th className="pb-3">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                  No hay veterinarios registrados
                </td>
              </tr>
            ) : vets.map(v => (
              <tr key={v.id} className={!v.estado ? 'opacity-50' : ''}>
                <td className="py-3 pr-4 font-medium text-gray-800" translate="no" lang="zxx">{v.nombre}</td>
                <td className="py-3 pr-4 text-gray-500">{v.telefono || '—'}</td>
                <td className="py-3 pr-4 text-gray-500">{v.email || '—'}</td>
                <td className="py-3 pr-4 text-gray-500">{v._count?.tratamientos ?? 0}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${v.estado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {v.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(v)}
                      className="text-xs text-primary-600 hover:underline font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggle(v.id)}
                      className={`text-xs font-medium hover:underline ${v.estado ? 'text-orange-600' : 'text-green-600'}`}
                    >
                      {v.estado ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VeterinariosTab;
