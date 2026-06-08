import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  Package, 
  AlertCircle, 
  AlertTriangle, 
  TrendingDown, 
  Trash2, 
  Calendar, 
  DollarSign,
  Info,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';

const ResumenInventarioTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResumen = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/inventario/resumen');
      setData(response.data);
    } catch (err) {
      console.error('Error resumen inventario:', err.response?.data || err.message);
      setError('No se pudo cargar el resumen del inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumen();
  }, []);

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner text="Generando resumen ejecutivo del inventario..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-2xl text-center shadow-sm">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        <p className="text-lg font-bold">{error}</p>
        <button onClick={fetchResumen} className="mt-4 btn-primary bg-red-600 hover:bg-red-700 border-none">Reintentar</button>
      </div>
    );
  }

  const { resumen, alertas } = data;

  const KpiCard = ({ icon: Icon, label, value, colorClass, subValue }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-black text-gray-800">{value}</p>
          {subValue && <span className="text-xs font-bold text-gray-400">{subValue}</span>}
        </div>
      </div>
    </div>
  );

  const AlertaItem = ({ item }) => {
    const isCritico = item.motivo === 'SIN_STOCK' || item.motivo === 'VENCIDO';
    
    return (
      <div className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:translate-x-1 ${isCritico ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isCritico ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            {item.motivo === 'SIN_STOCK' && <TrendingDown size={18} />}
            {item.motivo === 'VENCIDO' && <Trash2 size={18} />}
            {item.motivo === 'STOCK_BAJO' && <AlertTriangle size={18} />}
            {item.motivo === 'POR_VENCER' && <Calendar size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 text-sm">{item.nombre}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${item.itemTipo === 'ALIMENTO' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                {item.itemTipo}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              {item.motivo === 'SIN_STOCK' && 'Sin existencias disponibles'}
              {item.motivo === 'VENCIDO' && `Vencido el ${new Date(item.fechaVencimiento).toLocaleDateString()}`}
              {item.motivo === 'STOCK_BAJO' && `Stock bajo: ${item.stockCantidad} ${item.unidadMedida}`}
              {item.motivo === 'POR_VENCER' && `Vence pronto (${new Date(item.fechaVencimiento).toLocaleDateString()})`}
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white rounded-lg border border-inherit text-[10px] font-bold text-gray-400 shadow-sm">
          #{item.id}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard 
          icon={Package} 
          label="Total Insumos" 
          value={resumen.totalAlimentos + resumen.totalMedicamentos}
          subValue={`Activos: ${resumen.alimentosActivos + resumen.medicamentosActivos}`}
          colorClass="bg-blue-50 text-blue-600"
        />
        <KpiCard 
          icon={TrendingDown} 
          label="Sin Stock / Stock Bajo" 
          value={resumen.sinStock + resumen.stockBajo}
          subValue={`Críticos: ${resumen.sinStock}`}
          colorClass="bg-red-50 text-red-600"
        />
        <KpiCard 
          icon={Calendar} 
          label="Vencidos / Por Vencer" 
          value={resumen.vencidos + resumen.porVencer}
          subValue={`Críticos: ${resumen.vencidos}`}
          colorClass="bg-amber-50 text-amber-600"
        />
        <KpiCard 
          icon={DollarSign} 
          label="Valor Estimado" 
          value={`$${resumen.valorEstimado.toLocaleString()}`}
          colorClass="bg-green-50 text-green-600"
        />
        <KpiCard 
          icon={RefreshCcw} 
          label="Alimentos" 
          value={resumen.totalAlimentos}
          subValue={`${resumen.alimentosActivos} Activos`}
          colorClass="bg-orange-50 text-orange-600"
        />
        <KpiCard 
          icon={RefreshCcw} 
          label="Medicamentos" 
          value={resumen.totalMedicamentos}
          subValue={`${resumen.medicamentosActivos} Activos`}
          colorClass="bg-indigo-50 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ALERTAS CRÍTICAS */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <h3 className="font-black uppercase tracking-tight text-sm">Alertas Críticas</h3>
            </div>
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full">
              {alertas.criticas.length} ACCIONES REQUERIDAS
            </span>
          </div>
          <div className="p-6 space-y-3">
            {alertas.criticas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <CheckCircle2 size={40} className="mb-2 text-green-500 opacity-20" />
                <p className="text-sm font-bold italic">No hay alertas críticas</p>
              </div>
            ) : (
              alertas.criticas.map(alerta => <AlertaItem key={`${alerta.itemTipo}-${alerta.id}`} item={alerta} />)
            )}
          </div>
        </div>

        {/* ADVERTENCIAS */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={20} />
              <h3 className="font-black uppercase tracking-tight text-sm">Advertencias</h3>
            </div>
            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
              {alertas.advertencias.length} PENDIENTES
            </span>
          </div>
          <div className="p-6 space-y-3">
            {alertas.advertencias.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Info size={40} className="mb-2 text-blue-500 opacity-20" />
                <p className="text-sm font-bold italic">Todo al día</p>
              </div>
            ) : (
              alertas.advertencias.map(alerta => <AlertaItem key={`${alerta.itemTipo}-${alerta.id}`} item={alerta} />)
            )}
          </div>
        </div>

      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
        <Info className="text-blue-500 shrink-0" />
        <div className="text-xs text-blue-800 leading-relaxed">
          <p className="font-bold mb-1 uppercase tracking-wider">Info del Resumen</p>
          <p>Este resumen se calcula en base a los registros actuales. Las alertas criticas consideran productos vencidos o sin existencias. El valor estimado se calcula sumando el stock actual multiplicado por el precio de compra registrado (solo para items con precio disponible).</p>
        </div>
      </div>
      
    </div>
  );
};

export default ResumenInventarioTab;
