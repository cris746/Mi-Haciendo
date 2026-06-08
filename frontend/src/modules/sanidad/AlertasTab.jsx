import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const AlertasTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlertas();
  }, []);

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sanidad/alertas');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error('Error alertas sanitarias:', err.response?.data || err.message);
      setError('No se pudieron cargar las alertas sanitarias.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner text="Cargando alertas sanitarias..." />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;
  }

  if (!data || data.resumen.totalAlertas === 0) {
    return (
      <div className="py-16">
        <EmptyState 
          title="Sin alertas sanitarias"
          message="No hay dosis atrasadas ni medicamentos vencidos. ¡Todo está al día!"
        />
      </div>
    );
  }

  const { resumen, dosis, inventario } = data;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-red-600 text-sm font-medium">Críticas</p>
            <p className="text-2xl font-bold text-red-700">{resumen.criticas}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-full text-red-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-yellow-600 text-sm font-medium">Advertencias</p>
            <p className="text-2xl font-bold text-yellow-700">{resumen.advertencias}</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full text-yellow-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-blue-600 text-sm font-medium">Total Alertas</p>
            <p className="text-2xl font-bold text-blue-700">{resumen.totalAlertas}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Sección Roja: Críticas */}
      {(dosis.vencidas.length > 0 || inventario.medicamentosVencidos.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden">
          <div className="bg-red-500 px-4 py-3 border-b border-red-600">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Alertas Críticas
            </h3>
          </div>
          <div className="p-4 space-y-6">
            {dosis.vencidas.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Dosis Vencidas ({dosis.vencidas.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dosis.vencidas.map(d => (
                    <div key={d.id} className="p-3 border border-red-100 bg-red-50 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-red-700">{d.animal.nombre} ({d.animal.nroArete})</span>
                        <span className="text-xs font-bold px-2 py-1 bg-red-200 text-red-800 rounded-full">{d.diasAtraso}d atraso</span>
                      </div>
                      <p className="text-sm text-gray-700"><strong>Med:</strong> {d.medicamento.nombre}</p>
                      <p className="text-sm text-gray-600"><strong>Dosis:</strong> {d.dosis}</p>
                      <p className="text-xs text-gray-500 mt-2">Debió ser: {new Date(d.fechaSiguiente).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inventario.medicamentosVencidos.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Medicamentos Vencidos ({inventario.medicamentosVencidos.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inventario.medicamentosVencidos.map(m => (
                    <div key={m.id} className="p-3 border border-red-100 bg-red-50 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-red-700">{m.nombre}</span>
                        <span className="text-xs font-bold px-2 py-1 bg-red-200 text-red-800 rounded-full">{m.diasVencido}d vencido</span>
                      </div>
                      <p className="text-sm text-gray-700"><strong>Stock:</strong> {m.stockCantidad} {m.unidadMedida}</p>
                      <p className="text-xs text-gray-500 mt-2">Venció: {new Date(m.fechaVencimiento).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección Azul: Importante (Hoy) */}
      {dosis.hoy.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
          <div className="bg-blue-500 px-4 py-3 border-b border-blue-600">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Dosis para Hoy ({dosis.hoy.length})
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dosis.hoy.map(d => (
                <div key={d.id} className="p-3 border border-blue-100 bg-blue-50 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-blue-700">{d.animal.nombre} ({d.animal.nroArete})</span>
                    <span className="text-xs font-bold px-2 py-1 bg-blue-200 text-blue-800 rounded-full">Hoy</span>
                  </div>
                  <p className="text-sm text-gray-700"><strong>Med:</strong> {d.medicamento.nombre}</p>
                  <p className="text-sm text-gray-600"><strong>Dosis:</strong> {d.dosis}</p>
                  <p className="text-xs text-gray-500 mt-2">Vet: {d.veterinario.nombre}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sección Amarilla: Advertencias */}
      {(dosis.proximas.length > 0 || inventario.medicamentosPorVencer.length > 0 || inventario.stockBajo.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 overflow-hidden">
          <div className="bg-yellow-500 px-4 py-3 border-b border-yellow-600">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Advertencias
            </h3>
          </div>
          <div className="p-4 space-y-6">
            {dosis.proximas.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  Próximas Dosis ({dosis.proximas.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dosis.proximas.map(d => (
                    <div key={d.id} className="p-3 border border-yellow-100 bg-yellow-50 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-yellow-700">{d.animal.nombre} ({d.animal.nroArete})</span>
                        <span className="text-xs font-bold px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full">En {d.diasRestantes}d</span>
                      </div>
                      <p className="text-sm text-gray-700"><strong>Med:</strong> {d.medicamento.nombre}</p>
                      <p className="text-sm text-gray-600"><strong>Dosis:</strong> {d.dosis}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(d.fechaSiguiente).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inventario.medicamentosPorVencer.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  Medicamentos por Vencer ({inventario.medicamentosPorVencer.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inventario.medicamentosPorVencer.map(m => (
                    <div key={m.id} className="p-3 border border-yellow-100 bg-yellow-50 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-yellow-700">{m.nombre}</span>
                        <span className="text-xs font-bold px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full">En {m.diasRestantes}d</span>
                      </div>
                      <p className="text-sm text-gray-700"><strong>Stock:</strong> {m.stockCantidad} {m.unidadMedida}</p>
                      <p className="text-xs text-gray-500 mt-2">Vence: {new Date(m.fechaVencimiento).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inventario.stockBajo.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  Stock Bajo ({inventario.stockBajo.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inventario.stockBajo.map(m => (
                    <div key={m.id} className="p-3 border border-yellow-100 bg-yellow-50 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-yellow-700">{m.nombre}</span>
                        <span className="text-xs font-bold px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full">{m.stockCantidad} {m.unidadMedida}</span>
                      </div>
                      <p className="text-sm text-gray-700">Stock bajo: menor a 50</p>
                      {m.fechaVencimiento && (
                        <p className="text-xs text-gray-500 mt-2">Vence: {new Date(m.fechaVencimiento).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertasTab;
