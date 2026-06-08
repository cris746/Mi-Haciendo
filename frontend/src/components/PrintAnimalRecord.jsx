import React from 'react';

const fallback = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return value;
};

const fmtDate = (value) => {
  if (!value) return '—';
  const dateStr = String(value).split('T')[0];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return '—';
};

const fmtDateTime = (value) => {
  if (!value) {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
};

const fmtQty = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '—';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getAnimalStatus = (animal) => {
  if (!animal) return '—';
  if (animal.vendido === true) return 'VENDIDO';
  if (animal.estado === true) return 'ACTIVO';
  if (animal.estado === false && !animal.vendido) return 'INACTIVO';
  return '—';
};

const PrintAnimalRecord = ({
  mode,
  animal,
  genealogyData,
  descendenciaData,
  movimientosData,
  alimentacionData,
  sanidadData,
  user,
  role
}) => {
  if (!mode || !animal) return null;

  const status = getAnimalStatus(animal);

  return (
    <div className="print-only print-document animal-record-print text-black bg-white p-8 font-sans">
      
      {/* HEADER INSTITUCIONAL (COMÚN) */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider">Mi Hacienda</h1>
          <p className="text-sm font-bold text-gray-700">Sistema de Gestión Ganadera</p>
        </div>
        <div className="text-right text-xs">
          <p><strong>Fecha de emisión:</strong> {fmtDateTime()}</p>
          <p><strong>Generado por:</strong> {fallback(user?.nombre || user?.name || 'Usuario')}</p>
          <p><strong>Rol:</strong> {fallback(role || user?.role)}</p>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase border-y-2 border-black py-2">
          {mode === 'EXPEDIENTE' ? 'EXPEDIENTE DEL ANIMAL' : 'HISTORIA CLÍNICA DEL ANIMAL'}
        </h2>
      </div>

      {(status === 'VENDIDO' || status === 'INACTIVO') && (
        <div className="text-center border-4 border-black p-2 mb-6 uppercase font-black text-lg">
          ANIMAL {status}
        </div>
      )}

      {mode === 'EXPEDIENTE' && (
        <div>
          {/* 2. Datos generales */}
          <div className="mb-6">
            <h3 className="font-bold text-lg border-b border-gray-300 mb-2 uppercase">Datos Generales</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>ID / Arete:</strong> {fallback(animal.nroArete || animal.arete || animal.codigo)}</p>
                <p><strong>Nombre:</strong> {fallback(animal.nombre)}</p>
                <p><strong>Sexo:</strong> {fallback(animal.sexo)}</p>
                <p><strong>Estado:</strong> {status}</p>
              </div>
              <div>
                <p><strong>Raza:</strong> {fallback(animal.raza?.nombre || animal.raza)}</p>
                <p><strong>Categoría:</strong> {fallback(animal.categoria?.nombre || animal.categoria)}</p>
                <p><strong>Peso actual:</strong> {fmtQty(animal.peso)} kg</p>
                <p><strong>Fecha nacimiento:</strong> {fmtDate(animal.fechaNacimiento)}</p>
              </div>
            </div>
          </div>

          {/* 3. Genealogía */}
          <div className="mb-6">
            <h3 className="font-bold text-lg border-b border-gray-300 mb-2 uppercase">Genealogía y Descendencia</h3>
            {!genealogyData && (!descendenciaData || !descendenciaData.hijos || descendenciaData.hijos.length === 0) ? (
               <p className="text-sm italic">Sin registros disponibles.</p>
            ) : (
               <div className="text-sm">
                  {genealogyData ? (
                    <div className="mb-3">
                      <p><strong>Padre:</strong> {fallback(genealogyData.padre?.nombre)}</p>
                      <p><strong>Madre:</strong> {fallback(genealogyData.madre?.nombre)}</p>
                      {(genealogyData.padre?.padre || genealogyData.madre?.madre) && (
                        <div className="mt-2 pl-4 border-l-2 border-gray-200">
                          <p className="text-xs font-bold text-gray-500 uppercase">Abuelos</p>
                          <p><strong>Abuelo Paterno:</strong> {fallback(genealogyData.padre?.padre?.nombre)}</p>
                          <p><strong>Abuela Paterna:</strong> {fallback(genealogyData.padre?.madre?.nombre)}</p>
                          <p><strong>Abuelo Materno:</strong> {fallback(genealogyData.madre?.padre?.nombre)}</p>
                          <p><strong>Abuela Materna:</strong> {fallback(genealogyData.madre?.madre?.nombre)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mb-3"><strong>Padres:</strong> Sin registros disponibles.</p>
                  )}
                  
                  {descendenciaData?.hijos && descendenciaData.hijos.length > 0 ? (
                    <div>
                      <p className="font-bold mb-1">Descendencia ({descendenciaData.hijos.length}):</p>
                      <ul className="list-disc pl-5 text-xs">
                        {descendenciaData.hijos.map((hijo, idx) => (
                           <li key={idx}>
                             {fallback(hijo.nombre)} ({fallback(hijo.nroArete || hijo.arete)}) - {fallback(hijo.sexo)} - {getAnimalStatus(hijo)}
                           </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p><strong>Descendencia:</strong> Sin registros disponibles.</p>
                  )}
               </div>
            )}
          </div>

          {/* 4. Ubicación / movimientos */}
          <div className="mb-6">
            <h3 className="font-bold text-lg border-b border-gray-300 mb-2 uppercase">Movimientos y Ubicación</h3>
            {(!movimientosData || movimientosData.length === 0) ? (
              <p className="text-sm italic">Sin registros disponibles.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="text-left py-1">Parcela</th>
                    <th className="text-left py-1">Fecha Ingreso</th>
                    <th className="text-left py-1">Fecha Salida</th>
                    <th className="text-left py-1">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosData.map((mov, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-1">{fallback(mov.parcela?.nombre)}</td>
                      <td className="py-1">{fmtDate(mov.fechaIngreso)}</td>
                      <td className="py-1">{fmtDate(mov.fechaSalida)}</td>
                      <td className="py-1">{!mov.fechaSalida ? 'ACTUAL' : 'FINALIZADO'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 5. Alimentación */}
          <div className="mb-6">
            <h3 className="font-bold text-lg border-b border-gray-300 mb-2 uppercase">Alimentación</h3>
            {(!alimentacionData || alimentacionData.length === 0) ? (
              <p className="text-sm italic">Sin registros disponibles.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="text-left py-1">Fecha</th>
                    <th className="text-left py-1">Alimento</th>
                    <th className="text-right py-1">Cant.</th>
                    <th className="text-left py-1 pl-1">Unidad</th>
                    <th className="text-left py-1">Estado</th>
                    <th className="text-left py-1">Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {alimentacionData.map((alim, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-1">{fmtDate(alim.fecha)}</td>
                      <td className="py-1">{fallback(alim.alimento?.nombre)}</td>
                      <td className="text-right py-1">{fmtQty(alim.cantidad)}</td>
                      <td className="text-left py-1 pl-1">{fallback(alim.alimento?.unidadMedida)}</td>
                      <td className="py-1">{alim.estado === false ? 'ANULADO' : 'ACTIVO'}</td>
                      <td className="py-1 text-xs">{fallback(alim.observacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 6. Sanidad resumida */}
          <div className="mb-6">
            <h3 className="font-bold text-lg border-b border-gray-300 mb-2 uppercase">Sanidad (Resumen)</h3>
            {(!sanidadData || sanidadData.length === 0) ? (
              <p className="text-sm italic">Sin registros disponibles.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="text-left py-1">Inicio</th>
                    <th className="text-left py-1">Diagnóstico</th>
                    <th className="text-left py-1">Veterinario</th>
                    <th className="text-left py-1">Estado</th>
                    <th className="text-center py-1">Aplicaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sanidadData.map((t, idx) => {
                     const numApps = t.aplicaciones?.length || 0;
                     return (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="py-1">{fmtDate(t.fechaInicio || t.fecha)}</td>
                        <td className="py-1">{fallback(t.diagnostico?.descripcion || t.descripcion || t.tipo)}</td>
                        <td className="py-1">{fallback(t.veterinario?.nombre || t.veterinario)}</td>
                        <td className="py-1">{fallback(t.estadoTratamiento || t.estado)}</td>
                        <td className="text-center py-1">{numApps}</td>
                      </tr>
                     );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {mode === 'HISTORIA_CLINICA' && (
        <div>
          {/* 1. Identificación */}
          <div className="mb-6">
            <h3 className="font-bold text-lg border-b border-gray-300 mb-2 uppercase">Identificación del Paciente</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <p><strong>Arete:</strong> {fallback(animal.nroArete || animal.arete || animal.codigo)}</p>
              <p><strong>Nombre:</strong> {fallback(animal.nombre)}</p>
              <p><strong>Sexo:</strong> {fallback(animal.sexo)}</p>
              <p><strong>Raza:</strong> {fallback(animal.raza?.nombre || animal.raza)}</p>
              <p><strong>Categoría:</strong> {fallback(animal.categoria?.nombre || animal.categoria)}</p>
              <p><strong>Estado:</strong> {status}</p>
            </div>
          </div>

          {/* 2 y 3. Tratamientos y Aplicaciones */}
          <div className="mb-6">
            <h3 className="font-bold text-lg border-b border-gray-300 mb-2 uppercase">Historial de Tratamientos</h3>
            {(!sanidadData || sanidadData.length === 0) ? (
              <p className="text-sm italic">Sin historial sanitario registrado.</p>
            ) : (
              <div className="space-y-6">
                {sanidadData.map((t, idx) => (
                  <div key={idx} className="border border-gray-400 p-4 rounded bg-gray-50">
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <p><strong>ID Tratamiento:</strong> {fallback(t.id)}</p>
                      <p><strong>Estado:</strong> {fallback(t.estadoTratamiento || t.estado)}</p>
                      <p><strong>Fecha Inicio:</strong> {fmtDate(t.fechaInicio || t.fecha)}</p>
                      <p><strong>Fecha Fin:</strong> {fmtDate(t.fechaFin)}</p>
                      <p className="col-span-2"><strong>Veterinario:</strong> {fallback(t.veterinario?.nombre || t.veterinario)}</p>
                      <p className="col-span-2"><strong>Diagnóstico/Motivo:</strong> {fallback(t.diagnostico?.descripcion || t.descripcion || t.tipo)}</p>
                      {t.observaciones && <p className="col-span-2"><strong>Observaciones:</strong> {t.observaciones}</p>}
                    </div>

                    <h4 className="font-bold text-sm border-b border-gray-300 mb-2 mt-4 uppercase">Aplicaciones Realizadas</h4>
                    {(!t.aplicaciones || t.aplicaciones.length === 0) ? (
                      <p className="text-xs italic">Sin aplicaciones registradas.</p>
                    ) : (
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="text-left py-1">Fecha</th>
                            <th className="text-left py-1">Medicamento</th>
                            <th className="text-right py-1">Cant.</th>
                            <th className="text-left py-1">Próxima Dosis</th>
                            <th className="text-left py-1">Observación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {t.aplicaciones.map((app, appIdx) => (
                            <tr key={appIdx} className="border-b border-gray-200">
                              <td className="py-1">{fmtDate(app.fechaAplicacion || app.fecha)}</td>
                              <td className="py-1">{fallback(app.medicamento?.nombre || app.medicamento)}</td>
                              <td className="text-right py-1">{fmtQty(app.cantidad)}</td>
                              <td className="py-1">{fmtDate(app.fechaSiguiente || app.proximaDosis)}</td>
                              <td className="py-1">{fallback(app.observacion)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer del documento */}
      <div className="mt-8 pt-4 border-t-2 border-black text-center text-xs text-gray-600">
        <p>Documento oficial generado por el sistema <strong>Mi Hacienda</strong></p>
        <p>Prohibida su alteración o uso sin autorización.</p>
      </div>

    </div>
  );
};

export default PrintAnimalRecord;
