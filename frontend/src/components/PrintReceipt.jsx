import React from 'react';

const fmtCurrency = (value) => {
  const num = Number(value);
  if (isNaN(num)) return 'Bs. 0.00';
  return `Bs. ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtQty = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

const fallback = (value) => value || '—';

const PrintReceipt = ({ type, data, user, role }) => {
  if (!data) return null;

  const isVenta = type === 'VENTA';
  const titulo = isVenta ? 'NOTA DE VENTA' : 'COMPROBANTE DE COMPRA';
  const contraparte = isVenta ? data.cliente : data.proveedor;

  return (
    <div className="print-only print-document receipt-print receipt-box text-black bg-white p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black uppercase tracking-wider">Mi Hacienda</h1>
        <p className="text-sm font-bold text-gray-700">Sistema de Gestión Ganadera</p>
      </div>

      <div className="text-center mb-6 border-y-2 border-black py-3">
        <h2 className="text-xl font-bold uppercase">{titulo}</h2>
        {data.numeroFactura && (
          <p className="text-sm mt-1"><strong>N° Documento:</strong> {data.numeroFactura}</p>
        )}
      </div>

      {!data.estado && (
        <div className="text-center border-4 border-black p-2 mb-6">
          <h3 className="text-xl font-black uppercase tracking-widest">Documento Anulado</h3>
          {data.fechaAnulacion && <p className="text-sm font-bold mt-1">Fecha Anulación: {fmtDate(data.fechaAnulacion)}</p>}
          {data.motivoAnulacion && <p className="text-sm mt-1">Motivo: {data.motivoAnulacion}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p><strong>Fecha de {isVenta ? 'Venta' : 'Compra'}:</strong> {fmtDate(data.fecha)}</p>
          <p><strong>Estado:</strong> {data.estado ? 'ACTIVA' : 'ANULADA'}</p>
        </div>
        <div className="text-right">
          <p><strong>{isVenta ? 'Cliente' : 'Proveedor'}:</strong> {fallback(contraparte?.nombre)}</p>
          <p><strong>Teléfono:</strong> {fallback(contraparte?.telefono)}</p>
          {contraparte?.direccion && <p><strong>Dirección:</strong> {contraparte.direccion}</p>}
        </div>
      </div>

      <div className="mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              {isVenta ? (
                <>
                  <th className="text-left py-2 px-1">Animal</th>
                  <th className="text-left py-2 px-1">Arete</th>
                  <th className="text-right py-2 px-1">Peso (kg)</th>
                  <th className="text-right py-2 px-1">Precio Unit.</th>
                  <th className="text-right py-2 px-1">Subtotal</th>
                </>
              ) : (
                <>
                  <th className="text-left py-2 px-1">Tipo</th>
                  <th className="text-left py-2 px-1">Insumo</th>
                  <th className="text-right py-2 px-1">Cant.</th>
                  <th className="text-left py-2 px-1">Unidad</th>
                  <th className="text-right py-2 px-1">Precio Unit.</th>
                  <th className="text-right py-2 px-1">Subtotal</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.detalles?.map((d, index) => {
              if (isVenta) {
                const peso = d.pesoVenta != null ? d.pesoVenta : d.cantidad;
                const precio = d.precioKg != null ? d.precioKg : d.precio;
                return (
                  <tr key={index} className="border-b border-gray-300">
                    <td className="py-2 px-1">{fallback(d.animal?.nombre)}</td>
                    <td className="py-2 px-1">{fallback(d.animal?.nroArete)}</td>
                    <td className="text-right py-2 px-1">{fmtQty(peso)}</td>
                    <td className="text-right py-2 px-1">{fmtCurrency(precio)}</td>
                    <td className="text-right py-2 px-1 font-bold">{fmtCurrency(d.subtotal)}</td>
                  </tr>
                );
              } else {
                const isAlimento = !!d.alimentoId;
                const tipoStr = isAlimento ? 'ALIMENTO' : 'MEDICAMENTO';
                const nombreItem = isAlimento ? d.alimento?.nombre : d.medicamento?.nombre;
                const unidad = isAlimento ? d.alimento?.unidadMedida : d.medicamento?.unidadMedida;
                
                return (
                  <tr key={index} className="border-b border-gray-300">
                    <td className="py-2 px-1">{tipoStr}</td>
                    <td className="py-2 px-1">{fallback(nombreItem)}</td>
                    <td className="text-right py-2 px-1">{fmtQty(d.cantidad)}</td>
                    <td className="text-left py-2 px-1">{fallback(unidad)}</td>
                    <td className="text-right py-2 px-1">{fmtCurrency(d.precio)}</td>
                    <td className="text-right py-2 px-1 font-bold">{fmtCurrency(d.subtotal)}</td>
                  </tr>
                );
              }
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={isVenta ? "4" : "5"} className="text-right py-3 px-1 font-bold text-lg">TOTAL:</td>
              <td className="text-right py-3 px-1 font-black text-xl">{fmtCurrency(data.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {data.observacion && (
        <div className="mb-6 text-sm">
          <p className="font-bold border-b border-gray-300 mb-1">Observaciones:</p>
          <p>{data.observacion}</p>
        </div>
      )}

      <div className="mt-12 text-xs text-center text-gray-600 border-t border-black pt-4">
        <p>Documento generado por el sistema Mi Hacienda.</p>
        <p>Generado por: {user?.nombre || user?.name || 'Usuario'} ({role || user?.role || '—'})</p>
        <p>Fecha de emisión: {fmtDateTime()}</p>
      </div>
    </div>
  );
};

export default PrintReceipt;
