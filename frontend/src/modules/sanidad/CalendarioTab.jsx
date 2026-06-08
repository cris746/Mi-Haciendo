import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const CalendarioTab = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters state
  const [filters, setFilters] = useState({
    estado: 'TODOS',
    desde: '',
    hasta: '',
    animalId: '',
    medicamentoId: '',
    veterinarioId: ''
  });

  // Derivar listas únicas desde los eventos cargados
  const medicamentosDelCalendario = React.useMemo(() => {
    const map = new Map();
    eventos.forEach(ev => {
      if (ev.medicamento && ev.medicamento.id) {
        map.set(ev.medicamento.id, ev.medicamento);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [eventos]);

  const animalesDelCalendario = React.useMemo(() => {
    const map = new Map();
    eventos.forEach(ev => {
      if (ev.animal && ev.animal.id) {
        map.set(ev.animal.id, ev.animal);
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      const aText = `${a.nroArete} ${a.nombre}`;
      const bText = `${b.nroArete} ${b.nombre}`;
      return aText.localeCompare(bText);
    });
  }, [eventos]);

  const veterinariosDelCalendario = React.useMemo(() => {
    const map = new Map();
    eventos.forEach(ev => {
      if (ev.veterinario && ev.veterinario.id) {
        map.set(ev.veterinario.id, ev.veterinario);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [eventos]);

  // Limpiar filtros fantasma si la selección ya no aparece en los eventos
  useEffect(() => {
    if (!loading) {
      setFilters(prev => {
        let newFilters = { ...prev };
        let changed = false;

        if (prev.medicamentoId && !eventos.some(ev => ev.medicamento?.id.toString() === prev.medicamentoId)) {
          newFilters.medicamentoId = '';
          changed = true;
        }
        if (prev.animalId && !eventos.some(ev => ev.animal?.id.toString() === prev.animalId)) {
          newFilters.animalId = '';
          changed = true;
        }
        if (prev.veterinarioId && !eventos.some(ev => ev.veterinario?.id.toString() === prev.veterinarioId)) {
          newFilters.veterinarioId = '';
          changed = true;
        }

        return changed ? newFilters : prev;
      });
    }
  }, [eventos, loading]);

  useEffect(() => {
    fetchCalendario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchCalendario = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'TODOS') {
          queryParams.append(key, value);
        }
      });
      const { data } = await api.get(`/calendario?${queryParams.toString()}`);
      setEventos(data);
    } catch (err) {
      setError('No se pudo cargar el calendario sanitario.');
      console.error('Error calendario:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const formatDateSafe = (fechaStr) => {
    if (!fechaStr) return '';
    return fechaStr.split('T')[0].split('-').reverse().join('/');
  };

  // Calculate summaries based on current loaded events
  const sumVencidas = eventos.filter(e => e.estadoCalendario === 'VENCIDO').length;
  const sumHoy = eventos.filter(e => e.estadoCalendario === 'HOY').length;
  const sumProximas = eventos.filter(e => e.estadoCalendario === 'PROXIMO').length;
  const sumTotal = eventos.length;

  return (
    <div className="space-y-6">
      {/* Resumen de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-red-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Vencidas</p>
          <p className="text-3xl font-bold text-red-600">{sumVencidas}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Para Hoy</p>
          <p className="text-3xl font-bold text-blue-600">{sumHoy}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Próximas</p>
          <p className="text-3xl font-bold text-emerald-600">{sumProximas}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-bold uppercase">Total</p>
          <p className="text-3xl font-bold text-gray-800">{sumTotal}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Estado</label>
          <select name="estado" value={filters.estado} onChange={handleFilterChange} className="input text-sm">
            <option value="TODOS">Todos</option>
            <option value="VENCIDO">Vencido</option>
            <option value="HOY">Hoy</option>
            <option value="PROXIMO">Próximo</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Desde</label>
          <input type="date" name="desde" value={filters.desde} onChange={handleFilterChange} className="input text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Hasta</label>
          <input type="date" name="hasta" value={filters.hasta} onChange={handleFilterChange} className="input text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Animal</label>
          <select name="animalId" value={filters.animalId} onChange={handleFilterChange} className="input text-sm">
            <option value="">Todos</option>
            {animalesDelCalendario.map(a => <option key={a.id} value={a.id}>{a.nroArete} - {a.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Medicamento</label>
          <select name="medicamentoId" value={filters.medicamentoId} onChange={handleFilterChange} className="input text-sm">
            <option value="">Todos</option>
            {medicamentosDelCalendario.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Veterinario</label>
          <select name="veterinarioId" value={filters.veterinarioId} onChange={handleFilterChange} className="input text-sm">
            <option value="">Todos</option>
            {veterinariosDelCalendario.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[300px]">
        {loading && <div className="py-12"><LoadingSpinner text="Cargando calendario..." /></div>}
        {error && <div className="p-8 text-center text-red-600 font-medium">{error}</div>}
        {!loading && !error && eventos.length === 0 && (
          <div className="py-16">
            <EmptyState 
              title="Calendario vacío"
              message="No hay eventos sanitarios registrados para los filtros seleccionados."
            />
          </div>
        )}
        {!loading && !error && eventos.length > 0 && (
          <div className="divide-y divide-gray-100">
            {eventos.map(evento => {
              let statusStyle = 'border-emerald-500 bg-emerald-50 text-emerald-700';
              let badgeText = 'PRÓXIMO';
              let diasText = `En ${evento.diasRestantes} días`;

              if (evento.estadoCalendario === 'VENCIDO') {
                statusStyle = 'border-red-500 bg-red-50 text-red-700';
                badgeText = 'VENCIDO';
                diasText = `Hace ${Math.abs(evento.diasRestantes)} días`;
              } else if (evento.estadoCalendario === 'HOY') {
                statusStyle = 'border-blue-500 bg-blue-50 text-blue-700';
                badgeText = 'HOY';
                diasText = 'Hoy';
              }

              return (
                <div key={evento.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center gap-4">
                  {/* Left: Status & Date */}
                  <div className={`w-full md:w-32 shrink-0 p-3 rounded-lg border-l-4 flex flex-col items-center justify-center text-center ${statusStyle}`}>
                    <span className="text-xs font-bold uppercase tracking-wider mb-1">{badgeText}</span>
                    <span className="text-sm font-semibold">{formatDateSafe(evento.fechaSiguiente)}</span>
                    <span className="text-xs mt-1 font-medium opacity-80">{diasText}</span>
                  </div>

                  {/* Center: Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 text-lg">{evento.animal?.nombre || 'Animal no disponible'}</h4>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-medium border border-gray-200 shadow-sm">
                        {evento.animal?.nroArete || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-blue-700 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                      {evento.medicamento?.nombre || 'Medicamento no disponible'}
                    </div>
                    <div className="text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <p><span className="text-gray-400">Dosis:</span> <span className="font-medium text-gray-800">{evento.dosis}</span></p>
                      <p><span className="text-gray-400">Tipo:</span> <span className="font-medium text-gray-800">{evento.tratamiento?.tipo || 'N/A'}</span></p>
                      <p className="col-span-1 sm:col-span-2 truncate"><span className="text-gray-400">Tratamiento:</span> {evento.tratamiento?.descripcion || 'Sin descripción'}</p>
                    </div>
                  </div>

                  {/* Right: Vet & Original Date */}
                  <div className="w-full md:w-48 shrink-0 text-sm border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4 text-gray-500">
                    <p className="mb-1"><span className="font-medium block text-gray-400 text-xs uppercase">Veterinario</span> <span className="text-gray-800">{evento.veterinario?.nombre || 'N/A'}</span></p>
                    <p><span className="font-medium block text-gray-400 text-xs uppercase mt-2">Aplicado el</span> {formatDateSafe(evento.fechaAplicacion)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarioTab;
