import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, TrendingUp, ShoppingBag, Utensils, Stethoscope, Users,
  BarChart2, Filter, Download, Calendar, Search, RefreshCw, AlertCircle, Package, Activity, Map, ClipboardList, AlertTriangle, Printer
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PrintHeader from '../../components/PrintHeader';
import { triggerPrint, cleanupPrint } from '../../utils/printDocument';

// ─── Helpers ──────────────────────────────────────────────────
const fmtCurrency = (value) =>
  `Bs. ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const fmtDate = (value) => {
  if (!value || value === '—') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// ─── Tab Button ───────────────────────────────────────────────
const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${
      active
        ? 'border-primary-600 text-primary-600 bg-primary-50/50 font-bold'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`}
  >
    <Icon size={18} />
    <span className="text-sm whitespace-nowrap">{label}</span>
  </button>
);

// ─────────────────────────────────────────────────────────────
const Reportes = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isVet = user?.role === 'VETERINARIO';
  const isSeller = user?.role === 'VENDEDOR';

  const getInitialTab = () => {
    if (isSeller) return 'ventas';
    if (isVet) return 'animales';
    return 'ventas';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loading, setLoading] = useState(false);
  const [errorForbidden, setErrorForbidden] = useState(false);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    desde: '',
    hasta: '',
    estado: 'todas',
    estadoAnimales: 'TODOS',
    estadoMovimiento: 'TODOS',
    tipo: '',
    clienteId: '',
    proveedorId: '',
    veterinarioId: '',
    animalId: '',
    umbral: '10',
    search: '',
    alerta: 'TODAS',
    origen: '',
    itemTipo: 'TODOS',
    estadoTratamiento: 'TODOS',
    estadoDosis: 'TODAS'
  });

  // Para selects de filtros
  const [options, setOptions] = useState({
    clientes: [],
    proveedores: [],
    veterinarios: [],
    animales: []
  });

  useEffect(() => {
    fetchOptions();
    fetchReport();
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener('afterprint', cleanupPrint);
    return () => {
      window.removeEventListener('afterprint', cleanupPrint);
      cleanupPrint();
    };
  }, []);

  const fetchOptions = async () => {
    try {
      const ops = {
        clientes: [],
        proveedores: [],
        veterinarios: [],
        animales: []
      };
      
      const promises = [];
      
      if (isAdmin || isSeller) {
        promises.push(api.get('/clientes').then(res => ops.clientes = res.data || []).catch(e => console.error('Error fetching clientes', e)));
      }
      if (isAdmin) {
        promises.push(api.get('/proveedores').then(res => ops.proveedores = res.data || []).catch(e => console.error('Error fetching proveedores', e)));
      }
      if (isAdmin || isVet) {
        promises.push(api.get('/veterinarios').then(res => ops.veterinarios = res.data || []).catch(e => console.error('Error fetching veterinarios', e)));
      }
      
      promises.push(api.get('/animals').then(res => ops.animales = res.data || []).catch(e => console.error('Error fetching animales', e)));
      
      await Promise.all(promises);
      setOptions(ops);
    } catch (e) { console.error('Error in fetchOptions:', e); }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = `/reportes/${activeTab}`;
      const query = new URLSearchParams();
      if (filters.desde) query.append('desde', filters.desde);
      if (filters.hasta) query.append('hasta', filters.hasta);
      
      let estadoStr = filters.estado;
      if (['clientes', 'proveedores'].includes(activeTab)) {
        if (estadoStr === 'activas') estadoStr = 'activo';
        if (estadoStr === 'anuladas') estadoStr = 'inactivo';
      } else if (activeTab === 'alimentacion') {
        if (estadoStr === 'activas') estadoStr = 'ACTIVAS';
        if (estadoStr === 'anuladas') estadoStr = 'ANULADAS';
        if (estadoStr === 'todas') estadoStr = 'TODAS';
      }
      if (activeTab === 'animales') estadoStr = filters.estadoAnimales;

      if (estadoStr) query.append('estado', estadoStr);
      if (activeTab === 'movimientos-animales' && filters.estadoMovimiento) {
        query.append('estadoMovimiento', filters.estadoMovimiento);
      }

      if (filters.tipo) query.append('tipo', filters.tipo);
      if (filters.clienteId) query.append('clienteId', filters.clienteId);
      if (filters.proveedorId) query.append('proveedorId', filters.proveedorId);
      if (filters.veterinarioId) query.append('veterinarioId', filters.veterinarioId);
      if (filters.animalId) query.append('animalId', filters.animalId);
      if (filters.umbral) query.append('umbral', filters.umbral);
      if (filters.search) query.append('search', filters.search);
      if (filters.alerta && (activeTab === 'stock-bajo' || activeTab === 'inventario')) query.append('alerta', filters.alerta);
      if (filters.origen && activeTab === 'kardex') query.append('origen', filters.origen);
      if (filters.itemTipo && activeTab === 'kardex') query.append('itemTipo', filters.itemTipo);
      if (filters.estadoTratamiento && activeTab === 'sanitario') query.append('estadoTratamiento', filters.estadoTratamiento);
      if (filters.estadoDosis && activeTab === 'sanitario') query.append('estadoDosis', filters.estadoDosis);

      const { data: resData } = await api.get(`${endpoint}?${query.toString()}`);
      setData(resData);
      setErrorForbidden(false);
    } catch (error) {
      console.error('Error fetching report:', error);
      setData(null);
      if (error.response?.status === 403) {
        setErrorForbidden(true);
      } else {
        setErrorForbidden(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    return `"${String(value).replace(/"/g, '""')}"`;
  };

  const exportCSV = () => {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    let rows = [];
    
    if (activeTab === 'ventas' && Array.isArray(data.ventas)) {
      rows.push(['ID', 'Fecha', 'Factura', 'Cliente', 'Teléfono', 'Animales', 'Aretes', 'Cantidad', 'Peso Total (kg)', 'Precio Promedio (kg)', 'Total', 'Costo Compra', 'Ganancia Real', 'Estado', 'Fecha Anulación', 'Motivo Anulación', 'Observación']);
      data.ventas.forEach(v => {
        const costo = v.costoTotalVenta !== null ? fmtCurrency(v.costoTotalVenta) : 'No calculable';
        const ganancia = v.gananciaTotalVenta !== null ? fmtCurrency(v.gananciaTotalVenta) : 'No calculable';
        rows.push([
          v.id, fmtDate(v.fecha), v.numeroFactura || '—', v.cliente?.nombre || '—', v.telefonoCliente || '—',
          v.animales || '—', v.aretes || '—', v.cantidadAnimales || 0,
          v.pesoTotalVendido || 0, fmtCurrency(v.precioPromedioKg || 0), fmtCurrency(v.total || 0),
          costo, ganancia,
          v.estado ? 'Activa' : 'Anulada',
          fmtDate(v.fechaAnulacion), v.motivoAnulacion || '—', v.observacion || '—'
        ]);
      });
    } else if (activeTab === 'compras' && Array.isArray(data.compras)) {
      rows.push(['ID', 'Fecha', 'Factura', 'Proveedor', 'Teléfono', 'Ítems', 'Insumos Comprados', 'Total', 'Estado', 'Fecha Anulación', 'Motivo Anulación', 'Observación']);
      data.compras.forEach(c => {
        rows.push([
          c.id, fmtDate(c.fecha), c.numeroFactura || '—', c.proveedor?.nombre || '—', c.telefonoProveedor || '—',
          c.cantidadItems || 0, c.insumosComprados || '—', fmtCurrency(c.total || 0),
          c.estado ? 'Activa' : 'Anulada',
          fmtDate(c.fechaAnulacion), c.motivoAnulacion || '—', c.observacion || '—'
        ]);
      });
    } else if (activeTab === 'inventario' && Array.isArray(data.inventario)) {
      rows.push(['ID', 'Tipo', 'Nombre', 'Descripción', 'Stock', 'Unidad', 'Precio Compra', 'Valor Estimado', 'Fecha Vencimiento', 'Estado', 'Alerta']);
      data.inventario.forEach(i => {
        rows.push([
          i.id, i.tipo, i.nombre, i.descripcion, i.stock, i.unidad, 
          i.precioCompra !== undefined ? fmtCurrency(i.precioCompra) : '—', 
          i.valorEstimado !== undefined ? fmtCurrency(i.valorEstimado) : '—', 
          fmtDate(i.fechaVencimiento), i.estado, i.alerta
        ]);
      });
    } else if (activeTab === 'sanitario' && Array.isArray(data.sanidad)) {
      rows.push(['Tratamiento ID', 'Animal', 'Arete', 'Veterinario', 'Tipo', 'Descripción', 'Diagnóstico', 'Fecha Inicio', 'Fecha Fin', 'Estado Tratamiento', 'Medicamento', 'Cantidad Aplicada', 'Fecha Aplicación', 'Próxima Dosis', 'Estado Dosis', 'Observación Aplicación', 'Motivo Anulación']);
      data.sanidad.forEach(t => {
        rows.push([t.tratamientoId, t.animal, t.arete, t.veterinario, t.tipo, t.descripcion, t.diagnostico, fmtDate(t.fechaInicio), fmtDate(t.fechaFin), t.estadoTratamiento, t.medicamento, t.cantidadAplicada, fmtDate(t.fechaAplicacion), fmtDate(t.proximaDosis), t.estadoDosis, t.observacionAplicacion, t.motivoAnulacion]);
      });
    } else if (activeTab === 'animales-vendidos' && Array.isArray(data.animalesVendidos)) {
      rows.push(['Fecha Venta', 'Cliente', 'Animal', 'Nro Arete', 'Precio Venta', 'Costo Compra', 'Ganancia Real', 'Estado Venta']);
      data.animalesVendidos.forEach(item => {
        const costo = item.precioCompraAnimal !== null ? fmtCurrency(item.precioCompraAnimal) : 'Nacido en hacienda';
        const ganancia = item.gananciaAnimal !== null ? fmtCurrency(item.gananciaAnimal) : 'No calculable';
        rows.push([
          fmtDate(item.venta?.fecha), item.venta?.cliente?.nombre || '', item.animal?.nombre || '', item.animal?.nroArete || '', 
          fmtCurrency(item.subtotal || 0), costo, ganancia, item.venta?.estado ? 'Válida' : 'Anulada'
        ]);
      });
    } else if (activeTab === 'ganancias') {
      rows.push(['Métrica', 'Valor']);
      rows.push(['Periodo Desde', data.periodoDesde ? fmtDate(data.periodoDesde) : '—']);
      rows.push(['Periodo Hasta', data.periodoHasta ? fmtDate(data.periodoHasta) : '—']);
      rows.push(['Ventas Activas (Monto)', fmtCurrency(data.totalVentasActivas || 0)]);
      rows.push(['Compras Activas (Monto)', fmtCurrency(data.totalComprasActivas || 0)]);
      rows.push(['Ganancia Estimada', fmtCurrency(data.gananciaEstimada || 0)]);
      rows.push(['Ventas Activas (Cant.)', data.cantidadVentasActivas || 0]);
      rows.push(['Compras Activas (Cant.)', data.cantidadComprasActivas || 0]);
      rows.push(['Ventas Anuladas (Cant.)', data.cantidadVentasAnuladas || 0]);
      rows.push(['Compras Anuladas (Cant.)', data.cantidadComprasAnuladas || 0]);
    } else if (activeTab === 'clientes' && Array.isArray(data.clientes)) {
      rows.push(['ID', 'Nombre', 'Teléfono', 'Dirección', 'Ventas Activas', 'Total Ventas Activas', 'Ventas Anuladas', 'Última Venta', 'Estado']);
      data.clientes.forEach(c => {
        rows.push([c.id, c.nombre, c.telefono, c.direccion, c.cantidadVentasActivas, fmtCurrency(c.totalVentasActivas || 0), c.cantidadVentasAnuladas, fmtDate(c.ultimaVenta), c.estado ? 'Activo' : 'Inactivo']);
      });
    } else if (activeTab === 'proveedores' && Array.isArray(data.proveedores)) {
      rows.push(['ID', 'Nombre', 'Teléfono', 'Dirección', 'Compras Activas', 'Total Compras Activas', 'Compras Anuladas', 'Última Compra', 'Estado']);
      data.proveedores.forEach(p => {
        rows.push([p.id, p.nombre, p.telefono, p.direccion, p.cantidadComprasActivas, fmtCurrency(p.totalComprasActivas || 0), p.cantidadComprasAnuladas, fmtDate(p.ultimaCompra), p.estado ? 'Activo' : 'Inactivo']);
      });
    } else if (activeTab === 'animales' && Array.isArray(data.animales)) {
      rows.push(['ID', 'Nombre', 'Arete', 'Sexo', 'Categoría', 'Raza', 'Peso', 'Estado', 'Vendido', 'Padre', 'Madre', 'Parcela Actual']);
      data.animales.forEach(a => {
        rows.push([a.id, a.nombre, a.arete, a.sexo, a.categoria, a.raza, a.peso, a.estadoGanadero, a.vendido ? 'Sí' : 'No', a.padre, a.madre, a.parcelaActual]);
      });
    } else if (activeTab === 'alimentacion' && Array.isArray(data.alimentaciones)) {
      rows.push(['ID', 'Fecha', 'Animal', 'Arete', 'Alimento', 'Cantidad', 'Unidad', 'Estado', 'Observación', 'Fecha Anulación', 'Motivo Anulación']);
      data.alimentaciones.forEach(a => {
        rows.push([a.id, fmtDate(a.fecha), a.animal, a.arete, a.alimento, a.cantidad, a.unidad, a.estado, a.observacion, fmtDate(a.fechaAnulacion), a.motivoAnulacion]);
      });
    } else if (activeTab === 'movimientos-animales' && Array.isArray(data.movimientos)) {
      rows.push(['ID', 'Animal', 'Arete', 'Parcela', 'Fecha Ingreso', 'Fecha Salida', 'Estado Movimiento', 'Días en Parcela', 'Estado Animal', 'Vendido']);
      data.movimientos.forEach(m => {
        rows.push([m.id, m.animal, m.arete, m.parcela, fmtDate(m.fechaIngreso), fmtDate(m.fechaSalida), m.estadoMovimiento, m.diasEnParcela, m.estadoAnimal, m.vendido ? 'Sí' : 'No']);
      });
    } else if (activeTab === 'kardex' && Array.isArray(data.kardex)) {
      rows.push(['ID', 'Fecha', 'Tipo', 'Origen', 'Item Tipo', 'Insumo', 'Cantidad', 'Stock Previo', 'Stock Posterior', 'Motivo', 'Referencia Tipo', 'Referencia ID']);
      data.kardex.forEach(k => {
        rows.push([k.id, fmtDate(k.fecha), k.tipo, k.origen, k.itemTipo, k.insumo, k.cantidad, k.stockPrevio, k.stockPosterior, k.motivo, k.referenciaTipo, k.referenciaId]);
      });
    } else if (activeTab === 'stock-bajo' && Array.isArray(data.alertas)) {
      rows.push(['ID', 'Tipo', 'Nombre', 'Stock', 'Unidad', 'Fecha Vencimiento', 'Días para vencer', 'Alerta', 'Estado', 'Precio Compra', 'Valor Estimado']);
      data.alertas.forEach(a => {
        rows.push([
          a.id, a.tipo, a.nombre, a.stock, a.unidad, fmtDate(a.fechaVencimiento), a.diasParaVencer, a.alerta, a.estado,
          a.precioCompra !== undefined ? fmtCurrency(a.precioCompra) : '—',
          a.valorEstimado !== undefined ? fmtCurrency(a.valorEstimado) : '—'
        ]);
      });
    }
    
    const csvString = rows.map(row => row.map(escapeCSV).join(';')).join('\n');
    csvContent += csvString;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const renderVentas = () => {
    const list = Array.isArray(data?.ventas) ? data.ventas : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin ventas encontradas" 
          message="No se registraron ventas para los filtros seleccionados."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cliente</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Factura</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Animales</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Peso Total</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Costo Compra</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Ganancia Real</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((v) => (
            <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{fmtDate(v.fecha)}</td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                <span translate="no" lang="zxx">{v.cliente?.nombre || '—'}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{v.numeroFactura || '—'}</td>
              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={v.animales}>
                {v.cantidadAnimales > 0 ? `${v.cantidadAnimales} animal(es)` : '—'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {v.pesoTotalVendido > 0 ? `${Number(v.pesoTotalVendido).toFixed(2)} kg` : '—'}
                <div className="text-[10px] text-gray-400">Prom: {fmtCurrency(v.precioPromedioKg)}/kg</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {v.costoTotalVenta !== null ? fmtCurrency(v.costoTotalVenta) : <span className="text-gray-400 italic">No calculable</span>}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                {v.gananciaTotalVenta !== null ? fmtCurrency(v.gananciaTotalVenta) : <span className="text-gray-400 italic font-normal">—</span>}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1 items-start">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${v.estado ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {v.estado ? 'Activa' : 'Anulada'}
                  </span>
                  {!v.estado && v.motivoAnulacion && (
                    <span className="text-[10px] text-rose-500 max-w-[100px] truncate" title={v.motivoAnulacion}>
                      {v.motivoAnulacion}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{fmtCurrency(v.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 font-bold">
          <tr>
            <td colSpan="8" className="px-6 py-4 text-right text-gray-500">TOTAL GENERAL ({data?.cantidadVentas || 0} ventas)</td>
            <td className="px-6 py-4 text-right text-primary-700 text-lg">{fmtCurrency(data?.totalGeneral || 0)}</td>
          </tr>
        </tfoot>
      </table>
    );
  };

  const renderCompras = () => {
    const list = Array.isArray(data?.compras) ? data.compras : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin compras encontradas" 
          message="No se registraron compras para los filtros seleccionados."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Proveedor</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Factura</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Insumos</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{fmtDate(c.fecha)}</td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900"><span translate="no" lang="zxx">{c.proveedor?.nombre || '—'}</span></td>
              <td className="px-6 py-4 text-sm text-gray-600">{c.numeroFactura || '—'}</td>
              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={c.insumosComprados}>
                {c.cantidadItems > 0 ? c.insumosComprados : '—'}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1 items-start">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.estado ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                    {c.estado ? 'Activa' : 'Anulada'}
                  </span>
                  {!c.estado && c.motivoAnulacion && (
                    <span className="text-[10px] text-rose-500 max-w-[100px] truncate" title={c.motivoAnulacion}>
                      {c.motivoAnulacion}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{fmtCurrency(c.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 font-bold">
          <tr>
            <td colSpan="5" className="px-6 py-4 text-right text-gray-500">TOTAL COMPRAS ({data?.cantidadCompras || 0} facturas)</td>
            <td className="px-6 py-4 text-right text-rose-700 text-lg">{fmtCurrency(data?.totalGeneral || 0)}</td>
          </tr>
        </tfoot>
      </table>
    );
  };

  const renderInventario = () => {
    const list = Array.isArray(data?.inventario) ? data.inventario : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin datos de inventario" 
          message="No hay existencias o suministros que coincidan con la búsqueda."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Insumo</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Stock</th>
            {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Finanzas</th>}
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Vencimiento</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Alerta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((i) => (
            <tr key={`${i.tipo}-${i.id}`} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-600 font-bold">{i.tipo}</td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                <span translate="no" lang="zxx">{i.nombre}</span>
                <div className="text-[10px] text-gray-400 font-normal truncate max-w-[150px]">{i.descripcion}</div>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-indigo-600">{i.stock} {i.unidad}</td>
              {isAdmin && <td className="px-6 py-4 text-sm text-gray-600">
                <div className="font-bold text-emerald-700">{fmtCurrency(i.valorEstimado)}</div>
                <div className="text-[10px] text-gray-400">P.U: {fmtCurrency(i.precioCompra)}</div>
              </td>}
              <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(i.fechaVencimiento)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1 items-start">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    i.alerta === 'NORMAL' ? 'bg-emerald-100 text-emerald-700' :
                    i.alerta === 'SIN STOCK' ? 'bg-red-100 text-red-700' :
                    i.alerta === 'VENCIDO' ? 'bg-red-100 text-red-700' :
                    i.alerta === 'POR VENCER' ? 'bg-orange-100 text-orange-700' :
                    i.alerta === 'STOCK BAJO' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {i.alerta}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderKardex = () => {
    const list = Array.isArray(data?.kardex) ? data.kardex : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin movimientos en Kardex" 
          message="No se encontraron registros de entrada o salida en el historial."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Insumo</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Movimiento</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Origen</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Detalle Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((k) => (
            <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(k.fecha)}</td>
              <td className="px-6 py-4 text-sm">
                <div className="font-bold text-gray-900" translate="no" lang="zxx">{k.insumo}</div>
                <div className="text-[10px] text-gray-400 font-bold">{k.itemTipo}</div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  k.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' :
                  k.tipo === 'SALIDA' ? 'bg-orange-100 text-orange-700' :
                  k.tipo === 'REVERSION' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {k.tipo}
                </span>
                <div className="text-sm font-bold text-gray-900 mt-1 ml-1">{k.cantidad > 0 ? `+${k.cantidad}` : k.cantidad}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="font-bold text-gray-700">{k.origen}</div>
                <div className="text-xs text-gray-400 truncate max-w-[150px]" title={k.motivo}>{k.motivo}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <span className="text-gray-400">{k.stockPrevio}</span> → <span className="font-bold text-indigo-600">{k.stockPosterior}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderSanitario = () => {
    const list = Array.isArray(data?.sanidad) ? data.sanidad : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin historial sanitario" 
          message="No se encontraron tratamientos ni aplicaciones médicas."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tratamiento</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Animal / Veterinario</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Dosis Aplicada</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Próxima Dosis</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((t, idx) => (
            <tr key={`${t.tratamientoId}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm">
                <div className="font-bold text-gray-900">{t.tipo}</div>
                <div className="text-xs text-gray-500">{fmtDate(t.fechaInicio)}</div>
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.estadoTratamiento === 'EN CURSO' ? 'bg-blue-100 text-blue-700' : t.estadoTratamiento === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {t.estadoTratamiento}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="font-bold text-gray-900" translate="no" lang="zxx">{t.arete} - {t.animal}</div>
                <div className="text-xs text-gray-500 mt-1">Vet: <span translate="no" lang="zxx">{t.veterinario}</span></div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="font-bold text-gray-900">{t.medicamento}</div>
                <div className="text-xs">{t.cantidadAplicada !== '—' ? `${t.cantidadAplicada} aplicados el ${fmtDate(t.fechaAplicacion)}` : 'Sin aplicaciones'}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-900">{fmtDate(t.proximaDosis)}</div>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  t.estadoDosis === 'HOY' ? 'bg-orange-100 text-orange-700' :
                  t.estadoDosis === 'ATRASADA' ? 'bg-rose-100 text-rose-700' :
                  t.estadoDosis === 'PROXIMA' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.estadoDosis}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderAnimalesVendidos = () => {
    const list = Array.isArray(data?.animalesVendidos) ? data.animalesVendidos : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin animales vendidos" 
          message="No se encontraron registros de animales comercializados."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha Venta</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cliente</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Arete / Animal</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado Venta</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Precio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(item.venta?.fecha)}</td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900"><span translate="no" lang="zxx">{item.venta?.cliente?.nombre || '—'}</span></td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {item.animal?.nroArete} - <span translate="no" lang="zxx">{item.animal?.nombre || '—'}</span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.venta?.estado ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {item.venta?.estado ? 'Válida' : 'Anulada'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{fmtCurrency(item.precio)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 font-bold">
          <tr>
            <td colSpan="4" className="px-6 py-4 text-right text-gray-500">TOTAL ({data?.totalAnimales || 0} animales)</td>
            <td className="px-6 py-4 text-right text-primary-700 text-lg">{fmtCurrency(data?.totalRecaudado || 0)}</td>
          </tr>
        </tfoot>
      </table>
    );
  };

  const renderGanancias = () => {
    return (
      <div className="p-6 md:p-10 flex flex-col items-center justify-center text-center">
        {/* Ganancia General de la Hacienda */}
        <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase w-full max-w-4xl text-left border-b pb-2">Flujo de Caja General (Ventas vs Insumos)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10">
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center">
            <p className="text-sm font-bold text-emerald-600 uppercase mb-1">Ventas Activas</p>
            <p className="text-3xl font-black text-emerald-700">{fmtCurrency(data?.totalVentasActivas || 0)}</p>
            <p className="text-xs text-emerald-500 mt-1">{data?.cantidadVentasActivas || 0} operaciones válidas</p>
          </div>
          <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center">
            <p className="text-sm font-bold text-rose-600 uppercase mb-1">Compras Activas</p>
            <p className="text-3xl font-black text-rose-700">{fmtCurrency(data?.totalComprasActivas || 0)}</p>
            <p className="text-xs text-rose-500 mt-1">{data?.cantidadComprasActivas || 0} operaciones válidas</p>
          </div>
          <div className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center ${(data?.gananciaEstimada || 0) >= 0 ? 'bg-primary-50 border-primary-100' : 'bg-amber-50 border-amber-100'}`}>
            <p className={`text-sm font-bold uppercase mb-1 ${(data?.gananciaEstimada || 0) >= 0 ? 'text-primary-600' : 'text-amber-600'}`}>Flujo Neto Estimado</p>
            <p className={`text-3xl font-black ${(data?.gananciaEstimada || 0) >= 0 ? 'text-primary-700' : 'text-amber-700'}`}>{fmtCurrency(data?.gananciaEstimada || 0)}</p>
            <p className={`text-xs mt-1 ${(data?.gananciaEstimada || 0) >= 0 ? 'text-primary-500' : 'text-amber-500'}`}>
              Todas las ventas - compras
            </p>
          </div>
        </div>

        {/* Ganancia Específica de Ganado Comprado */}
        <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase w-full max-w-4xl text-left border-b pb-2">Rentabilidad de Animales Comprados (Vendidos en el periodo)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10">
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center">
            <p className="text-sm font-bold text-blue-600 uppercase mb-1">Ingreso por Venta</p>
            <p className="text-2xl font-black text-blue-700">{fmtCurrency(data?.ingresoGanadoCompradoVendido || 0)}</p>
            <p className="text-xs text-blue-500 mt-1">De los {data?.cantidadAnimalesCompradosVendidos || 0} animales comprados</p>
          </div>
          <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center">
            <p className="text-sm font-bold text-rose-600 uppercase mb-1">Costo de Compra Original</p>
            <p className="text-2xl font-black text-rose-700">{fmtCurrency(data?.costoGanadoVendido || 0)}</p>
            <p className="text-xs text-rose-500 mt-1">Inversión inicial</p>
          </div>
          <div className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center ${(data?.gananciaGanado || 0) >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-sm font-bold uppercase mb-1 ${(data?.gananciaGanado || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Ganancia Real (Animales)</p>
            <p className={`text-3xl font-black ${(data?.gananciaGanado || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmtCurrency(data?.gananciaGanado || 0)}</p>
            <p className={`text-xs mt-1 ${(data?.gananciaGanado || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              Ingreso - Costo original
            </p>
          </div>
        </div>
        
        <div className="w-full max-w-4xl bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase">Resumen de Operaciones Anuladas</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <span className="block text-xs font-bold text-gray-500">Ventas Anuladas</span>
              <span className="text-xl font-bold text-gray-800">{data?.cantidadVentasAnuladas || 0}</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <span className="block text-xs font-bold text-gray-500">Compras Anuladas</span>
              <span className="text-xl font-bold text-gray-800">{data?.cantidadComprasAnuladas || 0}</span>
            </div>
          </div>
        </div>
        <p className="text-gray-400 italic mt-6 text-sm max-w-2xl">
          * El <strong>Flujo Neto</strong> suma todo el dinero que entró por ventas menos todo lo que salió por compras de insumos. <br/>
          * La <strong>Ganancia Real de Animales</strong> solo toma en cuenta a los animales con origen "COMPRADO" que fueron vendidos en este periodo, restando lo que costaron al comprarlos del precio al que fueron vendidos.
        </p>
      </div>
    );
  };

  const renderClientes = () => {
    const list = Array.isArray(data?.clientes) ? data.clientes : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin clientes registrados" 
          message="No se encontraron clientes para los filtros aplicados."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nombre</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Contacto</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Ventas Activas</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Última Venta</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Monto Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm font-bold text-gray-900"><span translate="no" lang="zxx">{c.nombre}</span></td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex flex-col">
                  <span>{c.telefono || '—'}</span>
                  <span className="text-xs text-gray-400">{c.direccion || '—'}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.estado ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.estado ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-center">
                <span className="font-bold text-emerald-600">{c.cantidadVentasActivas}</span>
                {c.cantidadVentasAnuladas > 0 && <span className="text-[10px] text-rose-400 ml-1">({c.cantidadVentasAnuladas} anul)</span>}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(c.ultimaVenta)}</td>
              <td className="px-6 py-4 text-sm font-bold text-emerald-700 text-right">{fmtCurrency(c.totalVentasActivas)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderProveedores = () => {
    const list = Array.isArray(data?.proveedores) ? data.proveedores : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin proveedores registrados" 
          message="No se encontraron proveedores para los filtros aplicados."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nombre</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Contacto</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Compras Activas</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Última Compra</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Monto Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm font-bold text-gray-900"><span translate="no" lang="zxx">{p.nombre}</span></td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex flex-col">
                  <span>{p.telefono || '—'}</span>
                  <span className="text-xs text-gray-400">{p.direccion || '—'}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.estado ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.estado ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-center">
                <span className="font-bold text-blue-600">{p.cantidadComprasActivas}</span>
                {p.cantidadComprasAnuladas > 0 && <span className="text-[10px] text-rose-400 ml-1">({p.cantidadComprasAnuladas} anul)</span>}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(p.ultimaCompra)}</td>
              <td className="px-6 py-4 text-sm font-bold text-blue-700 text-right">{fmtCurrency(p.totalComprasActivas)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderAnimales = () => {
    const list = Array.isArray(data?.animales) ? data.animales : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin animales encontrados" 
          message="No se encontraron registros de animales para estos filtros."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Animal</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Categoría / Raza</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Peso</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Parcela Actual</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm">
                <div className="font-bold text-gray-900" translate="no" lang="zxx">{a.arete} - {a.nombre}</div>
                <div className="text-[10px] text-gray-400">{a.sexo}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="font-bold">{a.categoria}</div>
                <div className="text-xs">{a.raza}</div>
              </td>
              <td className="px-6 py-4 text-sm text-center font-bold text-indigo-600">{a.peso} kg</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${a.estadoGanadero === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {a.estadoGanadero}
                </span>
                {a.vendido && <span className="ml-2 px-2 py-1 rounded-full text-[10px] bg-amber-100 text-amber-700 font-bold uppercase">Vendido</span>}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{a.parcelaActual || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderAlimentacion = () => {
    const list = Array.isArray(data?.alimentaciones) ? data.alimentaciones : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin registros de alimentación" 
          message="No se encontraron suministros de alimento en este periodo."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Animal</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Alimento</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Cantidad</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(a.fecha)}</td>
              <td className="px-6 py-4 text-sm">
                <div className="font-bold text-gray-900" translate="no" lang="zxx">{a.arete} - {a.animal}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 font-bold" translate="no" lang="zxx">{a.alimento}</td>
              <td className="px-6 py-4 text-sm text-center font-bold text-orange-600">{a.cantidad} {a.unidad}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${a.estado === 'ACTIVA' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {a.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderMovimientosAnimales = () => {
    const list = Array.isArray(data?.movimientos) ? data.movimientos : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin movimientos de ganado" 
          message="No se encontraron traslados entre parcelas o ingresos."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Animal</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Parcela</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Ingreso</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Salida</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Permanencia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm">
                <div className="font-bold text-gray-900" translate="no" lang="zxx">{m.arete} - {m.animal}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{m.estadoAnimal} {m.vendido ? '(VENDIDO)' : ''}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 font-bold" translate="no" lang="zxx">{m.parcela}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(m.fechaIngreso)}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(m.fechaSalida)}</td>
              <td className="px-6 py-4 text-sm font-bold text-primary-600">{m.diasEnParcela} días</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderStockBajo = () => {
    const list = Array.isArray(data?.alertas) ? data.alertas : [];
    if (list.length === 0) return (
      <div className="py-20">
        <EmptyState 
          title="Sin alertas de stock" 
          message="Todos los insumos se encuentran por encima del umbral crítico."
        />
      </div>
    );
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nombre</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Vencimiento</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Stock</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Alerta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-600 font-bold">{a.tipo}</td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900"><span translate="no" lang="zxx">{a.nombre}</span></td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div>{fmtDate(a.fechaVencimiento)}</div>
                <div className="text-xs text-gray-400">Restan: {a.diasParaVencer} días</div>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-indigo-600">{a.stock} {a.unidad}</td>
              <td className="px-6 py-4 text-right">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  a.alerta === 'SIN STOCK' ? 'bg-red-100 text-red-700' :
                  a.alerta === 'VENCIDO' ? 'bg-red-100 text-red-700' :
                  a.alerta === 'POR VENCER' ? 'bg-orange-100 text-orange-700' :
                  a.alerta === 'STOCK BAJO' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {a.alerta}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centro de Reportes</h2>
          <p className="text-gray-500 text-sm">Genera informes detallados para la gestión de la hacienda</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => triggerPrint(null, { selector: '.print-document' })}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-semibold"
          >
            <Printer size={18} />
            Imprimir
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-semibold"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto scrollbar-hide no-print">
        <div className="flex">
          {(isAdmin || isSeller) && <TabButton active={activeTab === 'ventas'} onClick={() => setActiveTab('ventas')} icon={TrendingUp} label="Ventas" />}
          {isAdmin && <TabButton active={activeTab === 'compras'} onClick={() => setActiveTab('compras')} icon={ShoppingBag} label="Compras" />}
          {isAdmin && <TabButton active={activeTab === 'ganancias'} onClick={() => setActiveTab('ganancias')} icon={BarChart2} label="Ganancias" />}
          {(isAdmin || isSeller) && <TabButton active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} icon={Users} label="Clientes" />}
          {isAdmin && <TabButton active={activeTab === 'proveedores'} onClick={() => setActiveTab('proveedores')} icon={Users} label="Proveedores" />}
          {(isAdmin || isVet || isSeller) && <TabButton active={activeTab === 'animales'} onClick={() => setActiveTab('animales')} icon={FileText} label="Animales" />}
          {(isAdmin || isVet) && <TabButton active={activeTab === 'alimentacion'} onClick={() => setActiveTab('alimentacion')} icon={Utensils} label="Alimentación" />}
          {(isAdmin || isVet) && <TabButton active={activeTab === 'movimientos-animales'} onClick={() => setActiveTab('movimientos-animales')} icon={Map} label="Movimientos" />}
          {(isAdmin || isVet) && <TabButton active={activeTab === 'inventario'} onClick={() => setActiveTab('inventario')} icon={Package} label="Inventario" />}
          {isAdmin && <TabButton active={activeTab === 'kardex'} onClick={() => setActiveTab('kardex')} icon={ClipboardList} label="Kardex" />}
          {(isAdmin || isVet) && <TabButton active={activeTab === 'sanitario'} onClick={() => setActiveTab('sanitario')} icon={Stethoscope} label="Sanidad" />}
          {isAdmin && <TabButton active={activeTab === 'animales-vendidos'} onClick={() => setActiveTab('animales-vendidos')} icon={Activity} label="Animales Vendidos" />}
          {(isAdmin || isVet) && <TabButton active={activeTab === 'stock-bajo'} onClick={() => setActiveTab('stock-bajo')} icon={AlertTriangle} label="Stock Alertas" />}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Nombre, teléfono..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Desde</label>
            <input
              type="date"
              value={filters.desde}
              onChange={(e) => setFilters({ ...filters, desde: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Hasta</label>
            <input
              type="date"
              value={filters.hasta}
              onChange={(e) => setFilters({ ...filters, hasta: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              {['inventario', 'stock-bajo'].includes(activeTab) ? 'Alerta' : activeTab === 'kardex' ? 'Tipo Movimiento' : activeTab === 'sanitario' ? 'Estado Tratamiento' : 'Estado'}
            </label>
            {['inventario', 'stock-bajo'].includes(activeTab) ? (
              <select
                value={filters.alerta}
                onChange={(e) => setFilters({ ...filters, alerta: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              >
                <option value="TODAS">Todas</option>
                <option value="NORMAL">Normal</option>
                <option value="STOCK BAJO">Stock Bajo</option>
                <option value="POR VENCER">Por Vencer</option>
                <option value="VENCIDO">Vencido</option>
                <option value="SIN STOCK">Sin Stock</option>
              </select>
            ) : activeTab === 'kardex' ? (
              <select
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              >
                <option value="TODOS">Todos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SALIDA">Salida</option>
                <option value="REVERSION">Reversión</option>
              </select>
            ) : activeTab === 'sanitario' ? (
              <select
                value={filters.estadoTratamiento}
                onChange={(e) => setFilters({ ...filters, estadoTratamiento: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              >
                <option value="TODOS">Todos</option>
                <option value="EN CURSO">En Curso</option>
                <option value="CONCLUIDO">Concluido</option>
                <option value="ANULADO">Anulado</option>
              </select>
            ) : activeTab === 'animales' ? (
              <select
                value={filters.estadoAnimales}
                onChange={(e) => setFilters({ ...filters, estadoAnimales: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVOS">Solo Activos</option>
                <option value="VENDIDOS">Solo Vendidos</option>
                <option value="INACTIVOS">Solo Inactivos</option>
              </select>
            ) : activeTab === 'movimientos-animales' ? (
              <select
                value={filters.estadoMovimiento}
                onChange={(e) => setFilters({ ...filters, estadoMovimiento: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              >
                <option value="TODOS">Todos</option>
                <option value="ACTUALES">Actuales</option>
                <option value="HISTORICOS">Históricos</option>
              </select>
            ) : (
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              >
                <option value="todas">Todas / Todos</option>
                <option value="activas">Solo Activas / Activos</option>
                <option value="anuladas">Solo Anuladas / Inactivos</option>
              </select>
            )}
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-bold"
            >
              <Search size={18} />
              Generar Reporte
            </button>
          </div>
        </div>
      </div>

      {/* ── Resultados ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col print-container print-document">
        {loading ? (
          <div className="flex-1 py-20">
            <LoadingSpinner text="Generando reporte inteligente..." />
          </div>
        ) : errorForbidden ? (
          <div className="flex-1 py-20">
            <EmptyState 
              title="Acceso Denegado"
              message="No tienes permisos suficientes para visualizar este reporte."
              variant="danger"
            />
          </div>
        ) : !data ? (
          <div className="flex-1 py-20">
            <EmptyState 
              title="Reporte no generado"
              message="Selecciona los filtros deseados y haz clic en 'Generar Reporte' para visualizar los datos."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <PrintHeader user={user} filters={filters} activeTab={activeTab} />
            {activeTab === 'ventas' && renderVentas()}
            {activeTab === 'compras' && renderCompras()}
            {activeTab === 'ganancias' && renderGanancias()}
            {activeTab === 'clientes' && renderClientes()}
            {activeTab === 'proveedores' && renderProveedores()}
            {activeTab === 'animales' && renderAnimales()}
            {activeTab === 'alimentacion' && renderAlimentacion()}
            {activeTab === 'movimientos-animales' && renderMovimientosAnimales()}
            {activeTab === 'inventario' && renderInventario()}
            {activeTab === 'kardex' && renderKardex()}
            {activeTab === 'sanitario' && renderSanitario()}
            {activeTab === 'animales-vendidos' && renderAnimalesVendidos()}
            {activeTab === 'stock-bajo' && renderStockBajo()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;
