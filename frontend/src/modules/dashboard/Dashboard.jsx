import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Users, ShoppingBag, CreditCard, TrendingUp, Utensils, Activity,
  AlertTriangle, Package, Stethoscope, XCircle, Clock, ArrowUpRight,
  ArrowDownRight, BarChart2, RefreshCw, Trash2, TrendingDown,
  ArrowLeftRight, Boxes, Syringe, HeartPulse, AlertCircle, CalendarClock, Pill,
  ListOrdered
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

// ─── Helpers de Formato ───────────────────────────────────────────────
const fmtCurrency = (value) => `Bs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNumber = (value) => Number(value || 0).toLocaleString('en-US');
const fmtQty = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (value) => {
  if (!value) return '—';
  const [datePart] = String(value).split('T');
  if (!datePart) return '—';
  const parts = datePart.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return '—';
};

// ─── Componentes Reutilizables ─────────────────────────────────────────
const SectionTitle = ({ title }) => (
  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</h3>
);

const KPICard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const CompactCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const AlertBadge = ({ count, label, icon: Icon, color }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color}`}>
    <Icon size={18} />
    <span className="text-sm font-bold">{count} {label}</span>
  </div>
);

const ActRow = ({ left, right, sub, badge }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-800 truncate">{left}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
    <div className="text-right ml-3 shrink-0">
      <p className="text-sm font-bold text-gray-900">{right}</p>
      {badge && <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide mt-1 ${badge.color}`}>{badge.label}</span>}
    </div>
  </div>
);

const ActivityPanel = ({ title, icon: Icon, items, renderItem, emptyText }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-gray-500" />
      <h4 className="text-sm font-bold text-gray-700">{title}</h4>
    </div>
    {(!items || items.length === 0) ? (
      <div className="py-4">
        <EmptyState 
          title={emptyText || 'Sin actividad'}
          message="No hay registros recientes para esta categoría."
          compact={true}
        />
      </div>
    ) : (
      items.slice(0, 5).map(renderItem)
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isVet = user?.role === 'VETERINARIO';
  const isSeller = user?.role === 'VENDEDOR';

  const getInitialTab = () => {
    if (isSeller) return 'transacciones';
    if (isVet) return 'ganadera';
    return 'transacciones';
  };

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => { fetchMetrics(); }, []);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const { data } = await api.get('/dashboard');
      setMetrics(data);
      setErrorMsg(null);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setErrorMsg('Error cargando las métricas. Verifica la conexión.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner text="Cargando dashboard ejecutivo..." />
      </div>
    );
  }

  const m = metrics || {};

  // ── Arrays Seguros (Máximo 5 por panel manejado en el componente) ──
  const ventasRecientes = Array.isArray(m.ventasRecientes) ? m.ventasRecientes : (Array.isArray(m.ultimasVentas) ? m.ultimasVentas : []);
  const comprasRecientes = Array.isArray(m.comprasRecientes) ? m.comprasRecientes : (Array.isArray(m.ultimasCompras) ? m.ultimasCompras : []);
  const alimentacionesRecientes = Array.isArray(m.alimentacionesRecientes) ? m.alimentacionesRecientes : [];
  const movimientosAnimalesRecientes = Array.isArray(m.movimientosAnimalesRecientes) ? m.movimientosAnimalesRecientes : [];
  const tratamientosRecientes = Array.isArray(m.tratamientosRecientes) ? m.tratamientosRecientes : (Array.isArray(m.ultimosTratamientos) ? m.ultimosTratamientos : []);
  const movimientosInventarioRecientes = Array.isArray(m.movimientosInventarioRecientes) ? m.movimientosInventarioRecientes : [];
  const aplicacionesRecientes = Array.isArray(m.aplicacionesRecientes) ? m.aplicacionesRecientes : [];
  const dosisAtrasadasRecientes = Array.isArray(m.dosisAtrasadasRecientes) ? m.dosisAtrasadasRecientes : [];
  const dosisProximasRecientes = Array.isArray(m.dosisProximasRecientes) ? m.dosisProximasRecientes : [];

  // ── Alertas (Solo > 0) ──
  const criticas = [];
  if ((m.totalSinStock || 0) > 0) criticas.push({ label: 'Insumos sin stock', count: m.totalSinStock, icon: XCircle });
  if ((m.totalVencidos || 0) > 0) criticas.push({ label: 'Insumos vencidos', count: m.totalVencidos, icon: Trash2 });
  if ((m.dosisAtrasadas || 0) > 0) criticas.push({ label: 'Dosis atrasadas', count: m.dosisAtrasadas, icon: AlertCircle });

  const advertencias = [];
  if ((m.totalPorVencer || 0) > 0) advertencias.push({ label: 'Insumos por vencer', count: m.totalPorVencer, icon: Clock });
  if ((m.dosisHoy || 0) > 0) advertencias.push({ label: 'Dosis hoy', count: m.dosisHoy, icon: Syringe });
  if ((m.dosisProximas7Dias || 0) > 0) advertencias.push({ label: 'Dosis en 7 días', count: m.dosisProximas7Dias, icon: CalendarClock });

  const preventivas = [];
  if ((m.totalStockBajo || 0) > 0) preventivas.push({ label: 'Stock bajo', count: m.totalStockBajo, icon: TrendingDown });

  const hayAlertas = criticas.length > 0 || advertencias.length > 0 || preventivas.length > 0;

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. Header Ejecutivo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-0.5">Resumen general de Mi Hacienda</p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors px-4 py-2 rounded-xl shadow-sm"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertTriangle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* 2. Centro de Alertas Críticas */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-tight">Centro de Alertas</h3>
        </div>
        <div className="p-5">
          {!hayAlertas ? (
            <p className="text-sm text-emerald-600 font-medium flex items-center gap-2">
              <HeartPulse size={18} /> Sin alertas críticas por ahora. Todo en orden.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {criticas.map((a, i) => (
                <AlertBadge key={`c-${i}`} count={a.count} label={a.label} icon={a.icon} color="bg-red-50 text-red-700 border-red-200" />
              ))}
              {advertencias.map((a, i) => (
                <AlertBadge key={`a-${i}`} count={a.count} label={a.label} icon={a.icon} color="bg-orange-50 text-orange-700 border-orange-200" />
              ))}
              {preventivas.map((a, i) => (
                <AlertBadge key={`p-${i}`} count={a.count} label={a.label} icon={a.icon} color="bg-amber-50 text-amber-700 border-amber-200" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Resumen Ganadero */}
      <section>
        <SectionTitle title="Resumen Ganadero" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Animales Activos" value={fmtNumber(m.animalesActivos)} icon={Users} colorClass="bg-blue-500" subtitle="En hacienda" />
          <KPICard title="Animales Vendidos" value={fmtNumber(m.animalesVendidos)} icon={TrendingUp} colorClass="bg-emerald-500" subtitle="Total histórico" />
          <KPICard title="Animales Inactivos" value={fmtNumber(m.animalesInactivos)} icon={XCircle} colorClass="bg-gray-400" subtitle="Dados de baja" />
          <KPICard title="Movimientos Mes" value={fmtNumber(m.movimientosAnimalesMes)} icon={ArrowLeftRight} colorClass="bg-indigo-500" subtitle="Operaciones recientes" />
        </div>
      </section>

      {/* 4. Finanzas (Solo ADMIN y VENDEDOR parcial) */}
      {(isAdmin || isSeller) && (
        <section>
          <SectionTitle title={isAdmin ? "Finanzas Generales" : "Resumen Comercial"} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard title="Ventas Activas" value={fmtCurrency(m.totalVentas || m.ventasMes)} icon={TrendingUp} colorClass="bg-emerald-500" subtitle="Acumulado histórico" />
            {isAdmin && <KPICard title="Compras Insumos" value={fmtCurrency(m.totalCompras || m.comprasMes)} icon={ShoppingBag} colorClass="bg-rose-500" subtitle="Acumulado histórico" />}
            {isAdmin && <KPICard title="Flujo Neto Estimado" value={fmtCurrency(m.ganancias || m.gananciaMes)} icon={CreditCard} colorClass={((m.ganancias || m.gananciaMes) >= 0) ? 'bg-teal-500' : 'bg-red-500'} subtitle="Ventas - Compras Insumos" />}
            {isAdmin && <KPICard title="Valor Inventario" value={fmtCurrency(m.valorInventario)} icon={BarChart2} colorClass="bg-cyan-500" subtitle="Activos actuales" />}
          </div>
          {isAdmin && m.gananciaGanado !== undefined && (
            <>
              <SectionTitle title="Rendimiento de Ganado Comprado" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Ingreso Ganado Vendido" value={fmtCurrency(m.ingresoGanadoCompradoVendido)} icon={ArrowUpRight} colorClass="bg-blue-500" subtitle={`De ${m.cantidadAnimalesCompradosVendidos || 0} animal(es)`} />
                <KPICard title="Costo Ganado Vendido" value={fmtCurrency(m.costoGanadoVendido)} icon={ArrowDownRight} colorClass="bg-orange-500" subtitle="Costo original de compra" />
                <KPICard title="Ganancia Real Ganado" value={fmtCurrency(m.gananciaGanado)} icon={TrendingUp} colorClass={(m.gananciaGanado >= 0) ? 'bg-emerald-500' : 'bg-red-500'} subtitle="Ingreso - Costo Original" />
              </div>
            </>
          )}
        </section>
      )}

      {/* 5. Inventario */}
      {(isAdmin || isVet) && (
        <section>
          <SectionTitle title="Inventario" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isAdmin && <CompactCard title="Valor Alimentos" value={fmtCurrency(m.valorAlimentos)} icon={Utensils} colorClass="bg-orange-500" />}
            {isAdmin && <CompactCard title="Valor Medicamentos" value={fmtCurrency(m.valorMedicamentos)} icon={Pill} colorClass="bg-indigo-500" />}
            <CompactCard title="Sin Stock" value={fmtNumber(m.totalSinStock)} icon={XCircle} colorClass="bg-red-500" />
            <CompactCard title="Stock Bajo" value={fmtNumber(m.totalStockBajo)} icon={TrendingDown} colorClass="bg-amber-500" />
            <CompactCard title="Vencidos" value={fmtNumber(m.totalVencidos)} icon={Trash2} colorClass="bg-red-600" />
            <CompactCard title="Por Vencer" value={fmtNumber(m.totalPorVencer)} icon={Clock} colorClass="bg-orange-400" />
          </div>
        </section>
      )}

      {/* 6. Sanidad */}
      {(isAdmin || isVet) && (
        <section>
          <SectionTitle title="Sanidad" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompactCard title="Tratamientos Activos" value={fmtNumber(m.tratamientosActivos)} icon={Stethoscope} colorClass="bg-teal-500" />
            <CompactCard title="Dosis Atrasadas" value={fmtNumber(m.dosisAtrasadas)} icon={AlertCircle} colorClass="bg-red-500" />
            <CompactCard title="Dosis Hoy" value={fmtNumber(m.dosisHoy)} icon={Syringe} colorClass="bg-blue-500" />
            <CompactCard title="Dosis en 7 días" value={fmtNumber(m.dosisProximas7Dias)} icon={CalendarClock} colorClass="bg-orange-500" />
            <CompactCard title="Aplicaciones Mes" value={fmtNumber(m.aplicacionesMes)} icon={Activity} colorClass="bg-indigo-400" />
            <CompactCard title="Insumos Usados Mes" value={fmtQty(m.medicamentosUsadosMes || m.medicamentosUsados)} icon={Package} colorClass="bg-emerald-500" />
          </div>
        </section>
      )}

      {/* 7. Operación Diaria */}
      {(isAdmin || isVet) && (
        <section>
          <SectionTitle title="Operación Diaria (Mes)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompactCard title="Consumo Alimento" value={`${fmtQty(m.consumoAlimentoMes || m.consumoAlimento)} kg`} icon={Utensils} colorClass="bg-orange-600" />
            <CompactCard title="Alimentaciones" value={fmtNumber(m.alimentacionesMes)} icon={ListOrdered} colorClass="bg-amber-600" />
            <CompactCard title="Movs. Inventario" value={fmtNumber(m.movimientosInventarioMes)} icon={Boxes} colorClass="bg-blue-600" />
            <CompactCard title="Entradas Inventario" value={fmtNumber(m.entradasInventarioMes)} icon={ArrowDownRight} colorClass="bg-emerald-600" />
            <CompactCard title="Salidas Inventario" value={fmtNumber(m.salidasInventarioMes)} icon={ArrowUpRight} colorClass="bg-rose-600" />
            <CompactCard title="Reversiones" value={fmtNumber(m.reversionesInventarioMes)} icon={RefreshCw} colorClass="bg-gray-500" />
          </div>
        </section>
      )}

      {/* 8. Actividad Reciente con Tabs */}
      <section>
        <SectionTitle title="Actividad Reciente" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs Header */}
          <div className="flex items-center gap-1 bg-gray-50 p-2 border-b border-gray-200 overflow-x-auto">
            {[{ id: 'transacciones', label: 'Transacciones', icon: CreditCard, show: isAdmin || isSeller },
              { id: 'ganadera', label: 'Operación Ganadera', icon: Users, show: isAdmin || isVet },
              { id: 'sanidad', label: 'Insumos y Sanidad', icon: Stethoscope, show: isAdmin || isVet }
            ].filter(t => t.show).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-white text-primary-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tabs Content */}
          <div className="p-5 bg-gray-50/30">
            {activeTab === 'transacciones' && (isAdmin || isSeller) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ActivityPanel
                  title="Ventas Recientes" icon={TrendingUp} items={ventasRecientes}
                  renderItem={v => (
                    <ActRow key={v.id} left={v.cliente?.nombre || 'Sin cliente'} right={fmtCurrency(v.total)} sub={fmtDate(v.fecha)} badge={{ label: 'Activa', color: 'bg-emerald-100 text-emerald-700' }} />
                  )}
                />
                {isAdmin && <ActivityPanel
                  title="Compras Recientes" icon={ShoppingBag} items={comprasRecientes}
                  renderItem={c => (
                    <ActRow key={c.id} left={c.proveedor?.nombre || 'Sin proveedor'} right={fmtCurrency(c.total)} sub={fmtDate(c.fecha)} badge={{ label: 'Activa', color: 'bg-blue-100 text-blue-700' }} />
                  )}
                />}
              </div>
            )}

            {activeTab === 'ganadera' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ActivityPanel
                  title="Alimentaciones" icon={Utensils} items={alimentacionesRecientes}
                  renderItem={a => (
                    <ActRow key={a.id} left={a.animal?.nombre || 'Sin animal'} right={`${fmtQty(a.cantidad)} kg`} sub={`${a.alimento?.nombre || '—'} · ${fmtDate(a.fecha)}`} />
                  )}
                />
                <ActivityPanel
                  title="Movimientos Animales" icon={ArrowLeftRight} items={movimientosAnimalesRecientes}
                  renderItem={mov => (
                    <ActRow key={mov.id} left={mov.animal?.nombre || 'Sin animal'} right={mov.parcela?.nombre || '—'} sub={`Ingreso: ${fmtDate(mov.fechaIngreso)}`} />
                  )}
                />
                <ActivityPanel
                  title="Tratamientos" icon={Stethoscope} items={tratamientosRecientes}
                  renderItem={t => (
                    <ActRow key={t.id} left={t.animal?.nombre || 'Sin animal'} right={t.veterinario?.nombre || '—'} sub={`${t.tipo} · ${fmtDate(t.fechaInicio)}`} badge={t.estado ? { label: 'Activo', color: 'bg-teal-100 text-teal-700' } : { label: 'Anulado', color: 'bg-gray-100 text-gray-500' }} />
                  )}
                />
              </div>
            )}

            {activeTab === 'sanidad' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <ActivityPanel
                  title="Kardex Insumos" icon={Boxes} items={movimientosInventarioRecientes}
                  renderItem={k => (
                    <ActRow key={k.id} left={k.alimento?.nombre || k.medicamento?.nombre || 'Item'} right={fmtQty(k.cantidad)} sub={`${k.tipo} · ${fmtDate(k.fecha)}`} badge={{ label: k.tipo, color: k.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : k.tipo === 'SALIDA' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700' }} />
                  )}
                />
                <ActivityPanel
                  title="Aplicaciones" icon={Syringe} items={aplicacionesRecientes}
                  renderItem={ap => (
                    <ActRow key={ap.id} left={ap.tratamiento?.animal?.nombre || 'Sin animal'} right={fmtQty(ap.cantidad)} sub={`${ap.medicamento?.nombre || '—'} · ${fmtDate(ap.fecha)}`} />
                  )}
                />
                <ActivityPanel
                  title="Dosis Atrasadas" icon={AlertCircle} items={dosisAtrasadasRecientes}
                  renderItem={da => (
                    <ActRow key={da.id} left={da.tratamiento?.animal?.nombre || 'Sin animal'} right={da.medicamento?.nombre || '—'} sub={`Vencida: ${fmtDate(da.fechaSiguiente)}`} badge={{ label: 'Atrasada', color: 'bg-red-100 text-red-700' }} />
                  )}
                />
                <ActivityPanel
                  title="Próximas Dosis" icon={CalendarClock} items={dosisProximasRecientes}
                  renderItem={dp => (
                    <ActRow key={dp.id} left={dp.tratamiento?.animal?.nombre || 'Sin animal'} right={dp.medicamento?.nombre || '—'} sub={`Para: ${fmtDate(dp.fechaSiguiente)}`} badge={{ label: 'Próxima', color: 'bg-orange-100 text-orange-700' }} />
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
