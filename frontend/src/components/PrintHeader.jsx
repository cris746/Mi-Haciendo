import React from 'react';

const formatDateTime = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const getReportName = (activeTab) => {
  const tabs = {
    'ventas': 'Reporte de Ventas',
    'compras': 'Reporte de Compras',
    'ganancias': 'Reporte de Ganancias',
    'clientes': 'Reporte de Clientes',
    'proveedores': 'Reporte de Proveedores',
    'animales': 'Reporte de Animales',
    'alimentacion': 'Reporte de Alimentación',
    'movimientos-animales': 'Reporte de Movimientos de Animales',
    'inventario': 'Reporte de Inventario',
    'kardex': 'Reporte de Kardex',
    'sanitario': 'Reporte Sanitario',
    'animales-vendidos': 'Reporte de Animales Vendidos',
    'stock-bajo': 'Reporte de Alertas de Stock'
  };
  return tabs[activeTab] || 'Reporte General';
};

const PrintHeader = ({ user, filters, activeTab }) => {
  const hasFilters = Object.entries(filters || {}).some(([key, value]) => {
    if (!value || value === '' || value === 'todas' || value === 'TODOS' || value === 'TODAS') return false;
    if (key === 'search' && value.trim() === '') return false;
    return true;
  });

  return (
    <div className="print-only mb-6 text-black">
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider">Mi Hacienda</h1>
          <p className="text-sm font-bold text-gray-700">Sistema de Gestión Ganadera</p>
        </div>
        <div className="text-right">
          <p className="text-sm"><strong>Fecha de emisión:</strong> {formatDateTime()}</p>
          <p className="text-sm"><strong>Generado por:</strong> {user?.nombre || user?.name || 'Usuario'}</p>
          <p className="text-sm"><strong>Rol:</strong> {user?.role || '—'}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-bold uppercase mb-2">{getReportName(activeTab)}</h2>
        
        <div className="bg-gray-100 p-3 rounded text-sm">
          <span className="font-bold">Filtros aplicados: </span>
          {!hasFilters ? (
            <span>Sin filtros aplicados</span>
          ) : (
            <ul className="list-disc list-inside mt-1 grid grid-cols-2 gap-1">
              {filters.desde && <li>Desde: {filters.desde}</li>}
              {filters.hasta && <li>Hasta: {filters.hasta}</li>}
              {filters.estado && !['todas', 'TODOS'].includes(filters.estado) && <li>Estado: {filters.estado}</li>}
              {filters.estadoAnimales && filters.estadoAnimales !== 'TODOS' && <li>Estado Animal: {filters.estadoAnimales}</li>}
              {filters.estadoMovimiento && filters.estadoMovimiento !== 'TODOS' && <li>Estado Movimiento: {filters.estadoMovimiento}</li>}
              {filters.tipo && filters.tipo !== 'TODOS' && <li>Tipo: {filters.tipo}</li>}
              {filters.alerta && filters.alerta !== 'TODAS' && <li>Alerta: {filters.alerta}</li>}
              {filters.estadoTratamiento && filters.estadoTratamiento !== 'TODOS' && <li>Estado Tratamiento: {filters.estadoTratamiento}</li>}
              {filters.estadoDosis && filters.estadoDosis !== 'TODAS' && <li>Estado Dosis: {filters.estadoDosis}</li>}
              {filters.search && filters.search.trim() !== '' && <li>Búsqueda: {filters.search}</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
