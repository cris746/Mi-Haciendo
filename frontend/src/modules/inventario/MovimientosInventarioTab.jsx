import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Search, Filter, Calendar as CalendarIcon, RefreshCcw } from 'lucide-react';

function formatDateSafe(dateValue) {
  if (!dateValue) return '';
  const dateString = String(dateValue).split('T')[0];
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

const MovimientosInventarioTab = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    itemTipo: '',
    tipo: '',
    origen: '',
    desde: '',
    hasta: ''
  });

  const fetchMovimientos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'TODOS') {
          params[key] = filters[key];
        }
      });

      const response = await api.get('/inventario/movimientos', { params });
      setMovimientos(response.data);
    } catch (err) {
      console.error('Error movimientos inventario:', err.response?.data || err.message);
      setError('No se pudieron cargar los movimientos de inventario.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getTipoBadgeClass = (tipo) => {
    switch (tipo) {
      case 'ENTRADA': return 'bg-green-100 text-green-700 border-green-200';
      case 'SALIDA': return 'bg-red-100 text-red-700 border-red-200';
      case 'REVERSION': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'AJUSTE': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getItemTipoBadgeClass = (itemTipo) => {
    return itemTipo === 'ALIMENTO' 
      ? 'bg-amber-100 text-amber-700 border-amber-200' 
      : 'bg-indigo-100 text-indigo-700 border-indigo-200';
  };

  return (
    <div className="space-y-6">
      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Tipo de Item</label>
          <select name="itemTipo" value={filters.itemTipo} onChange={handleFilterChange} className="input text-sm py-1.5 h-auto">
            <option value="">TODOS</option>
            <option value="ALIMENTO">ALIMENTO</option>
            <option value="MEDICAMENTO">MEDICAMENTO</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Tipo Mov.</label>
          <select name="tipo" value={filters.tipo} onChange={handleFilterChange} className="input text-sm py-1.5 h-auto">
            <option value="">TODOS</option>
            <option value="ENTRADA">ENTRADA</option>
            <option value="SALIDA">SALIDA</option>
            <option value="REVERSION">REVERSION</option>
            <option value="AJUSTE">AJUSTE</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Origen</label>
          <select name="origen" value={filters.origen} onChange={handleFilterChange} className="input text-sm py-1.5 h-auto">
            <option value="">TODOS</option>
            <option value="COMPRA">COMPRA</option>
            <option value="ALIMENTACION">ALIMENTACIÓN</option>
            <option value="SANIDAD">SANIDAD</option>
            <option value="ANULACION_ALIMENTACION">ANUL. ALIM.</option>
            <option value="ANULACION_TRATAMIENTO">ANUL. TRAT.</option>
            <option value="ANULACION_COMPRA">ANUL. COMPRA</option>
            <option value="MANUAL">MANUAL</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-nowrap">Desde</label>
          <input type="date" name="desde" value={filters.desde} onChange={handleFilterChange} className="input text-sm py-1.5 h-auto" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-nowrap">Hasta</label>
          <input type="date" name="hasta" value={filters.hasta} onChange={handleFilterChange} className="input text-sm py-1.5 h-auto" />
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMovimientos} className="btn-primary p-2 h-auto flex-1 flex justify-center items-center gap-2 text-sm" title="Actualizar">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="lg:hidden xl:inline">Refrescar</span>
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="card overflow-x-auto p-0">
        {loading ? (
          <div className="py-20">
            <LoadingSpinner text="Cargando historial de movimientos..." />
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-500 bg-red-50">
            <p className="font-bold">{error}</p>
            <button onClick={fetchMovimientos} className="mt-4 text-sm font-bold underline">Intentar de nuevo</button>
          </div>
        ) : movimientos.length === 0 ? (
          <div className="py-20">
            <EmptyState 
              title="Sin movimientos de inventario"
              message="No se encontraron entradas, salidas o reversiones para los filtros seleccionados."
            />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Insumo</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Origen</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Cantidad</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Stock (Prev → Post)</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Motivo / Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movimientos.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-600">
                    {formatDateSafe(mov.fecha)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{mov.alimento?.nombre || mov.medicamento?.nombre || 'Sin referencia'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border w-fit mt-1 ${getItemTipoBadgeClass(mov.itemTipo)}`}>
                        {mov.itemTipo}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getTipoBadgeClass(mov.tipo)}`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">{mov.origen.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-primary-700 whitespace-nowrap">
                    {mov.tipo === 'SALIDA' ? '-' : '+'}{mov.cantidad} {mov.unidadMedida}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-500 font-mono whitespace-nowrap">
                    {mov.stockPrevio?.toFixed(2) || '0.00'} → <span className="font-bold text-gray-700">{mov.stockPosterior?.toFixed(2) || '0.00'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-600 italic line-clamp-1" title={mov.motivo}>{mov.motivo || '-'}</span>
                      {mov.referenciaTipo && (
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{mov.referenciaTipo} #{mov.referenciaId}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MovimientosInventarioTab;
