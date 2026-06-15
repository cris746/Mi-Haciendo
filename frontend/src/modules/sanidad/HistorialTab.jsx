import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

function formatDateSafe(dateValue) {
  if (!dateValue) return '';
  const dateString = String(dateValue).split('T')[0];
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

const HistorialTab = () => {
  const [animales, setAnimales] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [tratamientos, setTratamientos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals/Forms states
  const [showTratamientoForm, setShowTratamientoForm] = useState(false);
  const [showDiagnosticoForm, setShowDiagnosticoForm] = useState(false);
  const [showAplicacionForm, setShowAplicacionForm] = useState(false);
  const [activeTratamientoId, setActiveTratamientoId] = useState(null);

  // Estados para nuevos modales UX
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', variant: 'danger', confirmText: '', onConfirm: () => {} });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchAnimales();
  }, []);

  useEffect(() => {
    if (selectedAnimal) {
      fetchTratamientos(selectedAnimal);
    } else {
      setTratamientos([]);
    }
  }, [selectedAnimal]);

  const fetchAnimales = async () => {
    try {
      const { data } = await api.get('/animals');
      setAnimales(data);
    } catch (e) { console.error(e); }
  };

  const fetchTratamientos = async (id) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tratamientos/animal/${id}`);
      setTratamientos(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAnnul = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Anular tratamiento',
      message: '¿Está seguro de anular este tratamiento? Se revertirá el stock de los medicamentos aplicados y esta acción no se puede deshacer.',
      variant: 'danger',
      confirmText: 'Anular tratamiento',
      onConfirm: async () => {
        setModalLoading(true);
        try {
          await api.patch(`/tratamientos/${id}/anular`);
          fetchTratamientos(selectedAnimal);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (e) {
          alert(e.response?.data?.error || 'Error al anular');
        } finally {
          setModalLoading(false);
        }
      }
    });
  };

  const handleFinalizar = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Finalizar tratamiento',
      message: '¿Finalizar este seguimiento clínico? Se registrará la fecha actual y ya no se podrán agregar más medicamentos ni diagnósticos.',
      variant: 'success',
      confirmText: 'Finalizar',
      onConfirm: async () => {
        setModalLoading(true);
        try {
          await api.patch(`/tratamientos/${id}/finalizar`);
          fetchTratamientos(selectedAnimal);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (e) {
          alert(e.response?.data?.error || 'Error al finalizar');
        } finally {
          setModalLoading(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="card w-full md:max-w-xs p-3">
          <label className="label-xs mb-1">Seleccionar Animal</label>
          <select 
            className="input text-sm" 
            value={selectedAnimal} 
            onChange={e => setSelectedAnimal(e.target.value)}
          >
            <option value="">Seleccione animal...</option>
            {animales.filter(a => a.estado && !a.vendido).map(a => (
              <option key={a.id} value={a.id}>
                {a.nroArete} - {a.nombre}
              </option>
            ))}
          </select>
        </div>
        
        {selectedAnimal && (
          <button 
            onClick={() => setShowTratamientoForm(true)} 
            className="btn-primary text-sm px-4 py-2"
          >
            + Registrar Tratamiento
          </button>
        )}
      </div>

      {!selectedAnimal ? (
        <div className="py-12">
          <EmptyState 
            title="Seleccione un animal"
            message="Elija un animal del listado superior para ver su historial sanitario completo."
          />
        </div>
      ) : loading ? (
        <div className="py-12">
          <LoadingSpinner text="Cargando historial sanitario..." />
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Historial de Tratamientos</h3>
          {tratamientos.length === 0 ? (
            <div className="py-12">
              <EmptyState 
                title="Sin historial sanitario"
                message="Este animal aún no tiene tratamientos registrados en el sistema."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {tratamientos.map(t => {
                let statusLabel = 'EN CURSO';
                let statusBg = 'bg-blue-100 text-blue-700';
                let borderColor = 'border-l-blue-500';
                let cardBg = '';
                
                if (!t.estado) {
                  statusLabel = 'ANULADO';
                  statusBg = 'bg-red-100 text-red-700';
                  borderColor = 'border-l-red-500';
                  cardBg = 'bg-red-50 opacity-75';
                } else if (t.fechaFin) {
                  statusLabel = 'CONCLUIDO';
                  statusBg = 'bg-emerald-100 text-emerald-700';
                  borderColor = 'border-l-emerald-500';
                  cardBg = 'bg-emerald-50/30';
                }

                return (
                <div key={t.id} className={`card border-l-4 ${borderColor} ${cardBg}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${statusBg}`}>
                          {t.tipo} - {statusLabel}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          Inicio: {formatDateSafe(t.fechaInicio)}
                        </span>
                        {t.fechaFin ? (
                          <span className="text-xs text-gray-700 font-bold bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                            Finalizado: {formatDateSafe(t.fechaFin)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin fecha de finalización</span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-800 text-lg mt-2">{t.descripcion}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Veterinario: <span translate="no" lang="zxx" className="font-medium text-gray-700">{t.veterinario?.nombre}</span>
                      </p>
                    </div>
                    {t.estado && (
                      <div className="flex gap-2">
                        {!t.fechaFin && (
                          <button 
                            onClick={() => handleFinalizar(t.id)}
                            className="text-xs text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors border border-transparent hover:border-blue-200"
                          >
                            Finalizar
                          </button>
                        )}
                        <button 
                          onClick={() => handleAnnul(t.id)}
                          className="text-xs text-red-600 hover:bg-red-100 px-2 py-1 rounded transition-colors border border-transparent hover:border-red-200"
                        >
                          Anular
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-100">
                    {/* Diagnósticos */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Diagnósticos</p>
                        {t.estado && !t.fechaFin && (
                          <button 
                            onClick={() => { setActiveTratamientoId(t.id); setShowDiagnosticoForm(true); }}
                            className="text-[10px] font-bold text-primary-600 hover:underline"
                          >
                            + AGREGAR
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {t.diagnosticos?.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Sin diagnósticos</p>
                        ) : (
                          t.diagnosticos.map(d => (
                            <div key={d.id} className="text-sm bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
                              <div className="text-[10px] font-semibold text-gray-400 mb-1">
                                {formatDateSafe(d.fecha)}
                              </div>
                              <p className="text-gray-700">{d.descripcion}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Medicamentos */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Medicamentos</p>
                        {t.estado && !t.fechaFin && (
                          <button 
                            onClick={() => { setActiveTratamientoId(t.id); setShowAplicacionForm(true); }}
                            className="text-[10px] font-bold text-primary-600 hover:underline"
                          >
                            + APLICAR
                          </button>
                        )}
                      </div>
                      {t.aplicaciones && t.aplicaciones.length > 0 ? (
                        <div className="space-y-3">
                          {t.aplicaciones.map((ap) => (
                            <div key={ap.id} className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs text-gray-500 block mb-1">Medicamento:</span>
                                  <span translate="no" lang="zxx" className="font-bold text-blue-900 block text-base">{ap.medicamento?.nombre}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-gray-500 block mb-1">Fecha aplicación:</span>
                                  <span className="font-bold text-gray-800">{formatDateSafe(ap.fecha)}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white p-2 rounded border border-blue-50">
                                  <span className="text-gray-500 block">Dosis:</span>
                                  <span className="font-medium text-gray-800">{ap.dosis}</span>
                                </div>
                                <div className="bg-white p-2 rounded border border-blue-50">
                                  <span className="text-gray-500 block">Cant. descontada:</span>
                                  <span className="font-medium text-gray-800">{ap.cantidad} {ap.medicamento?.unidadMedida}</span>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-blue-100/50 mt-1">
                                {ap.fechaSiguiente ? (
                                  <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md font-bold text-xs shadow-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Próxima dosis: {formatDateSafe(ap.fechaSiguiente)}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Sin próxima dosis programada</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sin medicamentos aplicados</p>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Forms Modals */}
      {showTratamientoForm && (
        <TratamientoForm 
          animalId={selectedAnimal} 
          onClose={() => setShowTratamientoForm(false)} 
          onSuccess={() => { setShowTratamientoForm(false); fetchTratamientos(selectedAnimal); }}
        />
      )}

      {showDiagnosticoForm && (
        <DiagnosticoForm 
          tratamientoId={activeTratamientoId} 
          onClose={() => setShowDiagnosticoForm(false)} 
          onSuccess={() => { setShowDiagnosticoForm(false); fetchTratamientos(selectedAnimal); }}
        />
      )}

      {showAplicacionForm && (
        <AplicacionForm 
          tratamientoId={activeTratamientoId} 
          onClose={() => setShowAplicacionForm(false)} 
          onSuccess={() => { setShowAplicacionForm(false); fetchTratamientos(selectedAnimal); }}
        />
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

// --- Sub-componentes (Forms) ---

const TratamientoForm = ({ animalId, onClose, onSuccess }) => {
  const [vets, setVets] = useState([]);
  const [form, setForm] = useState({ veterinarioId: '', tipo: 'CURATIVO', descripcion: '', fechaInicio: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/veterinarios').then(({ data }) => setVets(data.filter(v => v.estado)));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/tratamientos', { 
        ...form, 
        animalId
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold mb-4">Registrar Nuevo Tratamiento</h3>
        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Veterinario</label>
            <select className="input" required value={form.veterinarioId} onChange={e => setForm({...form, veterinarioId: e.target.value})}>
              <option value="">Seleccione veterinario...</option>
              {vets.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
              <option value="CURATIVO">Curativo</option>
              <option value="PREVENTIVO">Preventivo</option>
              <option value="QUIRURGICO">Quirúrgico</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input" required rows="3" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Ej: Tratamiento para mastitis..." />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label">Fecha Inicio</label>
              <input type="date" className="input" required value={form.fechaInicio} onChange={e => setForm({...form, fechaInicio: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2">
              {loading ? 'Guardando...' : 'Guardar Tratamiento'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DiagnosticoForm = ({ tratamientoId, onClose, onSuccess }) => {
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/diagnosticos', { tratamientoId, descripcion });
      onSuccess();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold mb-4">Agregar Diagnóstico</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea className="input" required rows="4" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describa el diagnóstico..." />
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2">Guardar</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AplicacionForm = ({ tratamientoId, onClose, onSuccess }) => {
  const [meds, setMeds] = useState([]);
  const [form, setForm] = useState({ 
    medicamentoId: '', 
    dosis: '', 
    cantidad: 1, 
    fechaAdministracion: new Date().toISOString().split('T')[0],
    fechaSiguiente: '' 
  });
  const [loading, setLoading] = useState(false);

  // Filtrar medicamentos disponibles según fecha de aplicación, stock y estado
  const availableMeds = meds.filter(m => {
    const isOutOfStock = (m.contenidoPorUnidad > 0 && m.stockTotalBase !== null) ? m.stockTotalBase <= 0 : m.stockCantidad <= 0;
    if (!m.estado || isOutOfStock) return false;
    if (m.fechaVencimiento && form.fechaAdministracion) {
      const vDate = new Date(m.fechaVencimiento);
      vDate.setHours(0,0,0,0);
      const adminDate = new Date(form.fechaAdministracion);
      adminDate.setHours(0,0,0,0);
      if (vDate < adminDate) return false;
    }
    return true;
  });

  // Si cambia la fecha y el medicamento seleccionado ya no es apto, resetear selección
  useEffect(() => {
    if (form.medicamentoId) {
      const isStillAvailable = availableMeds.some(m => m.id === parseInt(form.medicamentoId));
      if (!isStillAvailable) {
        setForm(prev => ({ ...prev, medicamentoId: '' }));
      }
    }
  }, [form.fechaAdministracion, meds]);

  useEffect(() => {
    api.get('/sanidad/medicamentos/activos').then(({ data }) => setMeds(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medicamentoId) return;
    
    setLoading(true);
    // Front-end validation
    if (form.fechaSiguiente) {
      if (form.fechaSiguiente < form.fechaAdministracion) {
        alert('La próxima dosis no puede ser anterior a la fecha de aplicación.');
        setLoading(false);
        return;
      }
    }

    try {
      await api.post('/aplicaciones', { 
        ...form, 
        tratamientoId,
        fechaSiguiente: form.fechaSiguiente || null 
      });
      onSuccess();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold mb-4">Aplicar Medicamento</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2">
             <div className="grid grid-cols-1 gap-3">
               <div>
                 <label className="label text-xs font-bold text-gray-500 uppercase">Fecha Aplicación</label>
                 <input type="date" className="input bg-white" required value={form.fechaAdministracion} onChange={e => setForm({...form, fechaAdministracion: e.target.value})} />
               </div>
             </div>
          </div>

          <div>
            <label className="label">Medicamento</label>
            {availableMeds.length === 0 ? (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100 font-medium text-center">
                No hay medicamentos aptos para la fecha seleccionada.
              </p>
            ) : (
              <>
                <select className="input" required value={form.medicamentoId} onChange={e => setForm({...form, medicamentoId: e.target.value})}>
                  <option value="">Seleccione...</option>
                  {availableMeds.map(m => {
                    const usaNuevaLogica = m.contenidoPorUnidad > 0 && m.stockTotalBase !== null;
                    if (usaNuevaLogica) {
                      const eqFrasco = m.stockUnidades ? m.stockUnidades.toFixed(2).replace(/\.00$/, '') : 0;
                      return (
                        <option key={m.id} value={m.id}>
                          {m.nombre} - {m.presentacion || ''} — Stock: {m.stockTotalBase} {m.unidadBase} (Eq: {eqFrasco} {m.unidadCompra})
                        </option>
                      );
                    } else {
                      return (
                        <option key={m.id} value={m.id}>
                          {m.nombre} — Stock: {m.stockCantidad} {m.unidadMedida}
                        </option>
                      );
                    }
                  })}
                </select>
                {form.medicamentoId && availableMeds.find(m => m.id === parseInt(form.medicamentoId))?.contenidoPorUnidad > 0 && (
                  <div className="mt-2 text-xs bg-blue-50 p-2 rounded text-blue-800 border border-blue-100">
                    {(() => {
                      const selM = availableMeds.find(m => m.id === parseInt(form.medicamentoId));
                      if (selM && selM.stockTotalBase !== null && selM.stockUnidades !== null) {
                        const eqFrasco = selM.stockUnidades ? selM.stockUnidades.toFixed(2).replace(/\.00$/, '') : 0;
                        return (
                          <>
                            <div className="font-semibold">Stock disponible: {selM.stockTotalBase} {selM.unidadBase}</div>
                            <div>Equivalente físico: {eqFrasco} {selM.unidadCompra}</div>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dosis (Texto)</label>
              <input className="input" required value={form.dosis} onChange={e => setForm({...form, dosis: e.target.value})} placeholder="5ml, 2 pastillas..." />
            </div>
            <div>
              <label className="label">
                Cantidad a descontar ({(() => {
                  if (form.medicamentoId) {
                    const sel = availableMeds.find(m => m.id === parseInt(form.medicamentoId));
                    if (sel) {
                      return (sel.contenidoPorUnidad > 0 && sel.stockTotalBase !== null) ? sel.unidadBase : sel.unidadMedida;
                    }
                  }
                  return '...'
                })()})
              </label>
              <input type="number" step="0.01" className="input" required value={form.cantidad} onChange={e => setForm({...form, cantidad: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label className="label">Próxima Dosis (Opcional)</label>
            <input type="date" className="input" value={form.fechaSiguiente} onChange={e => setForm({...form, fechaSiguiente: e.target.value})} />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || !form.medicamentoId} className="btn-primary flex-1 py-2">Aplicar</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HistorialTab;
