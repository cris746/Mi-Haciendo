const IReportesRepository = require('../domain/IReportesRepository');
const prisma = require('../../../shared/infrastructure/persistence/prisma');

// Umbral por defecto para stock bajo (unificado con Inventario)
const STOCK_BAJO_UMBRAL = 50;

class PrismaReportesRepository extends IReportesRepository {

  // ─────────────────────────────────────────────────────────────
  // DASHBOARD — métricas ampliadas
  // ─────────────────────────────────────────────────────────────
  async getDashboardMetrics() {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const limite30 = new Date(hoy);
    limite30.setDate(limite30.getDate() + 30);
    limite30.setHours(23, 59, 59, 999);

    const finHoy = new Date(hoy);
    finHoy.setHours(23, 59, 59, 999);

    const limite7Dias = new Date(hoy);
    limite7Dias.setDate(limite7Dias.getDate() + 7);
    limite7Dias.setHours(23, 59, 59, 999);

    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    inicioMes.setHours(0, 0, 0, 0);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
    finMes.setHours(23, 59, 59, 999);

    // ── Animales ──
    const animalesActivos = await prisma.animal.count({
      where: { estado: true, vendido: false }
    });
    const animalesVendidos = await prisma.animal.count({
      where: { vendido: true }
    });
    const animalesInactivos = await prisma.animal.count({
      where: { estado: false, vendido: false }
    });
    const totalAnimales = animalesActivos + animalesVendidos + animalesInactivos;

    // ── Ventas totales (históricas, activas) ──
    const totalVentasRes = await prisma.venta.aggregate({
      where: { estado: true },
      _sum: { total: true }
    });
    // ── Ventas del mes actual ──
    const ventasMesRes = await prisma.venta.aggregate({
      where: { estado: true, fecha: { gte: inicioMes, lte: finMes } },
      _sum: { total: true },
      _count: { id: true }
    });

    // ── Compras totales (históricas, activas) ──
    const totalComprasRes = await prisma.compra.aggregate({
      where: { estado: true },
      _sum: { total: true }
    });
    // ── Compras del mes actual ──
    const comprasMesRes = await prisma.compra.aggregate({
      where: { estado: true, fecha: { gte: inicioMes, lte: finMes } },
      _sum: { total: true },
      _count: { id: true }
    });

    const totalVentas = totalVentasRes._sum.total || 0;
    const totalCompras = totalComprasRes._sum.total || 0;
    const ganancias = totalVentas - totalCompras;

    const ventasMes = ventasMesRes._sum.total || 0;
    const comprasMes = comprasMesRes._sum.total || 0;
    const gananciaMes = ventasMes - comprasMes;

    // ── Ganancia Ganado (Nuevos campos) ──
    const gananciaGanadoAgg = await prisma.detalleVenta.aggregate({
      where: { venta: { estado: true }, gananciaAnimal: { not: null } },
      _sum: { gananciaAnimal: true, precioCompraAnimal: true, subtotal: true },
      _count: { id: true }
    });

    const gananciaGanado = gananciaGanadoAgg._sum.gananciaAnimal || 0;
    const costoGanadoVendido = gananciaGanadoAgg._sum.precioCompraAnimal || 0;
    const ingresoGanadoCompradoVendido = gananciaGanadoAgg._sum.subtotal || 0;
    const cantidadAnimalesCompradosVendidos = gananciaGanadoAgg._count.id || 0;

    // ── Consumo alimento (solo alimentos activos) ──
    const consumoAlimento = await prisma.alimentacion.aggregate({
      where: { alimento: { estado: true } },
      _sum: { cantidad: true }
    });

    // ── Medicamentos ──
    const medicamentosUsados = await prisma.aplicacionMedicamento.count({
      where: { tratamiento: { estado: true } }
    });

    // ── Tratamientos ──
    const tratamientosActivos = await prisma.tratamiento.count({
      where: { estado: true, fechaFin: null }
    });
    const tratamientosAnulados = await prisma.tratamiento.count({
      where: { estado: false }
    });

    // ── MÉTRICAS DE INVENTARIO PROFESIONALES ──
    const alimentos = await prisma.alimento.findMany({ where: { estado: true } });
    const medicamentos = await prisma.medicamento.findMany({ where: { estado: true } });

    let valorAlimentos = 0;
    let alimentosSinStock = 0;
    let alimentosStockBajo = 0;
    let alimentosVencidos = 0;
    let alimentosPorVencer = 0;

    alimentos.forEach(a => {
      const stock = Number(a.stockCantidad || 0);
      const precio = Number(a.precioCompra || 0);
      valorAlimentos += (stock * precio);

      const vDate = a.fechaVencimiento ? new Date(a.fechaVencimiento) : null;
      let esCritico = false;

      if (stock <= 0) {
        alimentosSinStock++;
        esCritico = true;
      } else if (vDate && vDate < hoy) {
        alimentosVencidos++;
        esCritico = true;
      }

      if (!esCritico) {
        if (stock < STOCK_BAJO_UMBRAL) {
          alimentosStockBajo++;
        } else if (vDate && vDate <= limite30) {
          alimentosPorVencer++;
        }
      }
    });

    let valorMedicamentos = 0;
    let medicamentosSinStock = 0;
    let medicamentosStockBajo = 0;
    let medicamentosVencidos = 0;
    let medicamentosPorVencer = 0;

    medicamentos.forEach(m => {
      const stock = Number(m.stockCantidad || 0);
      const precio = Number(m.precioCompra || 0);
      valorMedicamentos += (stock * precio);

      const vDate = m.fechaVencimiento ? new Date(m.fechaVencimiento) : null;
      let esCritico = false;

      if (stock <= 0) {
        medicamentosSinStock++;
        esCritico = true;
      } else if (vDate && vDate < hoy) {
        medicamentosVencidos++;
        esCritico = true;
      }

      if (!esCritico) {
        if (stock < STOCK_BAJO_UMBRAL) {
          medicamentosStockBajo++;
        } else if (vDate && vDate <= limite30) {
          medicamentosPorVencer++;
        }
      }
    });

    const totalSinStock = alimentosSinStock + medicamentosSinStock;
    const totalStockBajo = alimentosStockBajo + medicamentosStockBajo;
    const totalVencidos = alimentosVencidos + medicamentosVencidos;
    const totalPorVencer = alimentosPorVencer + medicamentosPorVencer;
    const valorInventario = valorAlimentos + valorMedicamentos;

    // ── Actividad reciente ──
    const ultimasVentas = await prisma.venta.findMany({
      where: { estado: true },
      take: 5,
      orderBy: { fecha: 'desc' },
      include: {
        cliente: { select: { nombre: true } }
      }
    });

    const ultimasCompras = await prisma.compra.findMany({
      where: { estado: true },
      take: 5,
      orderBy: { fecha: 'desc' },
      include: {
        proveedor: { select: { nombre: true } }
      }
    });

    const ultimosTratamientos = await prisma.tratamiento.findMany({
      take: 5,
      orderBy: { fechaInicio: 'desc' },
      include: {
        animal: { select: { nombre: true, nroArete: true } },
        veterinario: { select: { nombre: true } }
      }
    });

    // ── FASE 9B: TRAZABILIDAD OPERATIVA ──

    // Alimentación
    const consumoAlimentoMesAgg = await prisma.alimentacion.aggregate({
      where: { estado: true, fecha: { gte: inicioMes, lte: finMes } },
      _sum: { cantidad: true }
    });
    const consumoAlimentoMes = consumoAlimentoMesAgg._sum.cantidad || 0;

    const alimentacionesMes = await prisma.alimentacion.count({
      where: { estado: true, fecha: { gte: inicioMes, lte: finMes } }
    });

    const alimentacionesAnuladas = await prisma.alimentacion.count({
      where: { estado: false }
    });

    const alimentoMasConsumidoQuery = await prisma.alimentacion.groupBy({
      by: ['alimentoId'],
      where: { estado: true },
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 1
    });
    let alimentoMasConsumidoNombre = '—';
    let alimentoMasConsumidoCantidad = 0;
    if (alimentoMasConsumidoQuery.length > 0) {
      alimentoMasConsumidoCantidad = alimentoMasConsumidoQuery[0]._sum.cantidad || 0;
      const al = await prisma.alimento.findUnique({ where: { id: alimentoMasConsumidoQuery[0].alimentoId }});
      if (al) alimentoMasConsumidoNombre = al.nombre;
    }

    const animalMayorConsumoQuery = await prisma.alimentacion.groupBy({
      by: ['animalId'],
      where: { estado: true },
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 1
    });
    let animalMayorConsumoNombre = '—';
    let animalMayorConsumoCantidad = 0;
    if (animalMayorConsumoQuery.length > 0) {
      animalMayorConsumoCantidad = animalMayorConsumoQuery[0]._sum.cantidad || 0;
      const an = await prisma.animal.findUnique({ where: { id: animalMayorConsumoQuery[0].animalId }});
      if (an) animalMayorConsumoNombre = `${an.nombre} (${an.nroArete})`;
    }

    const alimentacionesRecientes = await prisma.alimentacion.findMany({
      where: { estado: true },
      take: 5,
      orderBy: { fecha: 'desc' },
      include: {
        alimento: { select: { nombre: true } },
        animal: { select: { nombre: true, nroArete: true } }
      }
    });

    // Movimientos de Animales
    const movimientosAnimalesMes = await prisma.movimiento.count({
      where: { fechaIngreso: { gte: inicioMes, lte: finMes } }
    });

    const animalesConMovimientoMesAgg = await prisma.movimiento.groupBy({
      by: ['animalId'],
      where: { fechaIngreso: { gte: inicioMes, lte: finMes } }
    });
    const animalesConMovimientoMes = animalesConMovimientoMesAgg.length;

    const movimientosAnimalesRecientes = await prisma.movimiento.findMany({
      take: 5,
      orderBy: { fechaIngreso: 'desc' },
      include: {
        animal: { select: { nombre: true, nroArete: true } },
        parcela: { select: { nombre: true } }
      }
    });

    // Movimientos Inventario / Kardex
    const movimientosInventarioMes = await prisma.movimientoInventario.count({
      where: { fecha: { gte: inicioMes, lte: finMes } }
    });

    const entradasInventarioMes = await prisma.movimientoInventario.count({
      where: { tipo: 'ENTRADA', fecha: { gte: inicioMes, lte: finMes } }
    });

    const salidasInventarioMes = await prisma.movimientoInventario.count({
      where: { tipo: 'SALIDA', fecha: { gte: inicioMes, lte: finMes } }
    });

    const reversionesInventarioMes = await prisma.movimientoInventario.count({
      where: { tipo: 'REVERSION', fecha: { gte: inicioMes, lte: finMes } }
    });

    const movimientosInventarioRecientes = await prisma.movimientoInventario.findMany({
      take: 5,
      orderBy: { fecha: 'desc' },
      include: {
        alimento: { select: { nombre: true } },
        medicamento: { select: { nombre: true } }
      }
    });

    // ── FASE 9C: ALERTAS SANITARIAS CRÍTICAS ──

    const baseAlertaSanitariaWhere = {
      fechaSiguiente: { not: null },
      tratamiento: {
        estado: true,
        fechaFin: null,
        animal: { estado: true, vendido: false }
      }
    };

    const dosisAtrasadasCount = await prisma.aplicacionMedicamento.count({
      where: { ...baseAlertaSanitariaWhere, fechaSiguiente: { lt: hoy } }
    });
    
    const dosisHoyCount = await prisma.aplicacionMedicamento.count({
      where: { ...baseAlertaSanitariaWhere, fechaSiguiente: { gte: hoy, lte: finHoy } }
    });
    
    const dosisProximas7DiasCount = await prisma.aplicacionMedicamento.count({
      where: { ...baseAlertaSanitariaWhere, fechaSiguiente: { gt: finHoy, lte: limite7Dias } }
    });

    const includeAplicacionCompleta = {
      medicamento: { select: { nombre: true, unidadMedida: true } },
      tratamiento: {
        include: {
          animal: { select: { nombre: true, nroArete: true } },
          veterinario: { select: { nombre: true } }
        }
      }
    };

    const dosisAtrasadasRecientes = await prisma.aplicacionMedicamento.findMany({
      where: { ...baseAlertaSanitariaWhere, fechaSiguiente: { lt: hoy } },
      orderBy: { fechaSiguiente: 'asc' },
      take: 5,
      include: includeAplicacionCompleta
    });

    const dosisProximasRecientes = await prisma.aplicacionMedicamento.findMany({
      where: { ...baseAlertaSanitariaWhere, fechaSiguiente: { gte: hoy, lte: limite7Dias } },
      orderBy: { fechaSiguiente: 'asc' },
      take: 5,
      include: includeAplicacionCompleta
    });

    const aplicacionesMes = await prisma.aplicacionMedicamento.count({
      where: {
        fecha: { gte: inicioMes, lte: finMes },
        tratamiento: { estado: true }
      }
    });

    const medicamentosUsadosMesAgg = await prisma.aplicacionMedicamento.aggregate({
      where: {
        fecha: { gte: inicioMes, lte: finMes },
        tratamiento: { estado: true }
      },
      _sum: { cantidad: true }
    });
    const medicamentosUsadosMes = medicamentosUsadosMesAgg._sum.cantidad || 0;

    const aplicacionesRecientes = await prisma.aplicacionMedicamento.findMany({
      where: { tratamiento: { estado: true } },
      orderBy: { fecha: 'desc' },
      take: 5,
      include: includeAplicacionCompleta
    });

    const animalMasTratadoQuery = await prisma.tratamiento.groupBy({
      by: ['animalId'],
      where: { estado: true, animal: { estado: true, vendido: false } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1
    });

    let animalMasTratadoNombre = 'Sin datos';
    let animalMasTratadoCantidad = 0;
    if (animalMasTratadoQuery.length > 0) {
      animalMasTratadoCantidad = animalMasTratadoQuery[0]._count.id || 0;
      const anTratado = await prisma.animal.findUnique({ where: { id: animalMasTratadoQuery[0].animalId } });
      if (anTratado) animalMasTratadoNombre = `${anTratado.nombre} (${anTratado.nroArete})`;
    }

    const alertasSanitariasCriticas = dosisAtrasadasCount;
    const alertasSanitariasAdvertencias = dosisHoyCount + dosisProximas7DiasCount;

    return {
      // Campos existentes (compatibilidad hacia atrás)
      totalAnimales,
      animalesActivos,
      animalesVendidos,
      totalVentas,
      totalCompras,
      ganancias,
      consumoAlimento: consumoAlimento._sum.cantidad || 0,
      medicamentosUsados,
      animalesInactivos,
      ventasMes,
      comprasMes,
      gananciaMes,
      cantidadVentasMes: ventasMesRes._count.id || 0,
      cantidadComprasMes: comprasMesRes._count.id || 0,
      tratamientosActivos,
      tratamientosAnulados,
      ultimasVentas,
      ultimasCompras,
      ultimosTratamientos,
      umbralStockBajo: STOCK_BAJO_UMBRAL,
      
      gananciaGanado,
      costoGanadoVendido,
      ingresoGanadoCompradoVendido,
      cantidadAnimalesCompradosVendidos,
      
      // Nuevas métricas FASE 9A
      valorInventario,
      valorAlimentos,
      valorMedicamentos,
      totalSinStock,
      totalStockBajo,
      totalVencidos,
      totalPorVencer,
      alimentosSinStock,
      medicamentosSinStock,
      alimentosStockBajo,
      medicamentosStockBajo,
      alimentosVencidos,
      medicamentosVencidos,
      alimentosPorVencer,
      medicamentosPorVencer,
      stockBajo: totalStockBajo, // Alias para compatibilidad

      // Nuevas métricas FASE 9B
      consumoAlimentoMes,
      alimentacionesMes,
      alimentacionesAnuladas,
      alimentoMasConsumidoNombre,
      alimentoMasConsumidoCantidad,
      animalMayorConsumoNombre,
      animalMayorConsumoCantidad,
      alimentacionesRecientes,
      movimientosAnimalesMes,
      animalesConMovimientoMes,
      movimientosAnimalesRecientes,
      movimientosInventarioMes,
      entradasInventarioMes,
      salidasInventarioMes,
      reversionesInventarioMes,
      movimientosInventarioRecientes,

      // Nuevas métricas FASE 9C
      dosisAtrasadas: dosisAtrasadasCount,
      dosisHoy: dosisHoyCount,
      dosisProximas7Dias: dosisProximas7DiasCount,
      aplicacionesMes,
      medicamentosUsadosMes,
      animalMasTratadoNombre,
      animalMasTratadoCantidad,
      aplicacionesRecientes,
      dosisAtrasadasRecientes,
      dosisProximasRecientes,
      alertasSanitariasCriticas,
      alertasSanitariasAdvertencias
    };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE VENTAS (con filtros)
  // ─────────────────────────────────────────────────────────────
  async getSalesReport({ desde, hasta, clienteId, estado } = {}) {
    const where = {};
    if (estado === 'todas') {
      // sin filtro de estado
    } else if (estado === 'anuladas') {
      where.estado = false;
    } else {
      where.estado = true; // default: solo activas
    }
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) {
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        where.fecha.lte = fin;
      }
    }
    if (clienteId) where.clienteId = parseInt(clienteId);

    const ventasRaw = await prisma.venta.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        cliente: { select: { nombre: true, telefono: true } },
        detalles: {
          include: {
            animal: { select: { nombre: true, nroArete: true } }
          }
        }
      }
    });

    const ventas = ventasRaw.map(v => {
      const cantidadAnimales = v.detalles.length;
      const pesoTotalVendido = v.detalles.reduce((acc, d) => acc + (d.pesoVenta || d.cantidad || 0), 0);
      const precioPromedioKg = pesoTotalVendido > 0 ? (v.total / pesoTotalVendido) : 0;
      const animalesList = v.detalles.map(d => d.animal?.nombre).filter(Boolean).join('; ');
      const aretesList = v.detalles.map(d => d.animal?.nroArete).filter(Boolean).join('; ');

      // Cálculos financieros reales
      const costoTotalVenta = v.detalles.reduce((acc, d) => acc + (d.precioCompraAnimal || 0), 0);
      const gananciaTotalVenta = v.detalles.reduce((acc, d) => acc + (d.gananciaAnimal || 0), 0);
      const tieneCosto = v.detalles.some(d => d.precioCompraAnimal !== null);

      return {
        ...v,
        telefonoCliente: v.cliente?.telefono || '—',
        cantidadAnimales,
        pesoTotalVendido,
        precioPromedioKg,
        animales: animalesList || '—',
        aretes: aretesList || '—',
        costoTotalVenta: tieneCosto ? costoTotalVenta : null,
        gananciaTotalVenta: tieneCosto ? gananciaTotalVenta : null
      };
    });

    const totaleAgregado = await prisma.venta.aggregate({
      where: { ...where },
      _sum: { total: true },
      _count: { id: true }
    });

    return {
      ventas,
      totalGeneral: totaleAgregado._sum.total || 0,
      cantidadVentas: totaleAgregado._count.id || 0
    };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE COMPRAS (con filtros)
  // ─────────────────────────────────────────────────────────────
  async getPurchasesReport({ desde, hasta, proveedorId, estado } = {}) {
    const where = {};
    if (estado === 'todas') {
      // sin filtro
    } else if (estado === 'anuladas') {
      where.estado = false;
    } else {
      where.estado = true;
    }
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) {
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        where.fecha.lte = fin;
      }
    }
    if (proveedorId) where.proveedorId = parseInt(proveedorId);

    const comprasRaw = await prisma.compra.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        proveedor: { select: { nombre: true, telefono: true } },
        detalles: {
          include: {
            alimento: { select: { nombre: true, unidadMedida: true } },
            medicamento: { select: { nombre: true, unidadMedida: true } }
          }
        }
      }
    });

    const compras = comprasRaw.map(c => {
      const cantidadItems = c.detalles.length;
      const insumosStr = c.detalles.map(d => {
        const nombre = d.alimento?.nombre || d.medicamento?.nombre || 'Ítem';
        const unidad = d.alimento?.unidadMedida || d.medicamento?.unidadMedida || 'unid';
        return `${nombre} x ${d.cantidad} ${unidad}`;
      }).join('; ');

      return {
        ...c,
        telefonoProveedor: c.proveedor?.telefono || '—',
        cantidadItems,
        insumosComprados: insumosStr || '—'
      };
    });

    const agregado = await prisma.compra.aggregate({
      where: { ...where },
      _sum: { total: true },
      _count: { id: true }
    });

    return {
      compras,
      totalGeneral: agregado._sum.total || 0,
      cantidadCompras: agregado._count.id || 0
    };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE INVENTARIO (con filtro de tipo)
  // ─────────────────────────────────────────────────────────────
  async getInventoryReport({ tipo } = {}) {
    let alimentos = [];
    let medicamentos = [];

    if (!tipo || tipo === 'alimento') {
      alimentos = await prisma.alimento.findMany({
        where: { estado: true },
        orderBy: { nombre: 'asc' }
      });
    }

    if (!tipo || tipo === 'medicamento') {
      medicamentos = await prisma.medicamento.findMany({
        where: { estado: true },
        orderBy: { nombre: 'asc' }
      });
    }

    // Consumo agrupado por alimento
    const consumoPorAlimento = await prisma.alimentacion.groupBy({
      by: ['alimentoId'],
      where: { alimento: { estado: true } },
      _sum: { cantidad: true }
    });

    // Aplicaciones agrupadas por medicamento
    const aplicacionesPorMedicamento = await prisma.aplicacionMedicamento.groupBy({
      by: ['medicamentoId'],
      where: { tratamiento: { estado: true } },
      _count: { id: true }
    });

    const alimentosConConsumo = alimentos.map(a => ({
      ...a,
      totalConsumido: consumoPorAlimento.find(c => c.alimentoId === a.id)?._sum.cantidad || 0
    }));

    const medicamentosConUso = medicamentos.map(m => ({
      ...m,
      totalAplicaciones: aplicacionesPorMedicamento.find(ap => ap.medicamentoId === m.id)?._count.id || 0
    }));

    return { alimentos: alimentosConConsumo, medicamentos: medicamentosConUso };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE SANITARIO
  // ─────────────────────────────────────────────────────────────
  async getSanitarioReport({ desde, hasta, veterinarioId, animalId, estado } = {}) {
    const where = {};
    if (estado === 'todas') {
      // sin filtro
    } else if (estado === 'anulados') {
      where.estado = false;
    } else {
      where.estado = true;
    }
    if (desde || hasta) {
      where.fechaInicio = {};
      if (desde) where.fechaInicio.gte = new Date(desde);
      if (hasta) {
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        where.fechaInicio.lte = fin;
      }
    }
    if (veterinarioId) where.veterinarioId = parseInt(veterinarioId);
    if (animalId) where.animalId = parseInt(animalId);

    const tratamientos = await prisma.tratamiento.findMany({
      where,
      orderBy: { fechaInicio: 'desc' },
      include: {
        animal: { select: { nombre: true, nroArete: true } },
        veterinario: { select: { nombre: true } },
        aplicaciones: {
          include: {
            medicamento: { select: { nombre: true, unidadMedida: true } }
          }
        },
        diagnosticos: true
      }
    });

    return {
      tratamientos,
      totalTratamientos: tratamientos.length,
      totalAplicaciones: tratamientos.reduce((acc, t) => acc + t.aplicaciones.length, 0)
    };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE ANIMALES VENDIDOS
  // ─────────────────────────────────────────────────────────────
  async getAnimalesVendidosReport({ desde, hasta } = {}) {
    const whereVenta = { estado: true };
    if (desde || hasta) {
      whereVenta.fecha = {};
      if (desde) whereVenta.fecha.gte = new Date(desde);
      if (hasta) {
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        whereVenta.fecha.lte = fin;
      }
    }

    const detalles = await prisma.detalleVenta.findMany({
      where: {
        venta: whereVenta,
        animalId: { not: null }
      },
      include: {
        animal: {
          include: {
            categoria: { select: { nombre: true } },
            raza: { select: { nombre: true } }
          }
        },
        venta: {
          include: {
            cliente: { select: { nombre: true } }
          }
        }
      },
      orderBy: { venta: { fecha: 'desc' } }
    });

    const totalRecaudado = detalles.reduce((acc, d) => acc + d.subtotal, 0);

    return {
      animalesVendidos: detalles,
      totalAnimales: detalles.length,
      totalRecaudado
    };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE GANANCIAS
  // ─────────────────────────────────────────────────────────────
  async getGananciasReport({ desde, hasta } = {}) {
    const rangoFecha = {};
    if (desde) rangoFecha.gte = new Date(desde);
    if (hasta) {
      const fin = new Date(hasta);
      fin.setHours(23, 59, 59, 999);
      rangoFecha.lte = fin;
    }

    const whereVentaActiva = { estado: true };
    const whereCompraActiva = { estado: true };
    const whereVentaAnulada = { estado: false };
    const whereCompraAnulada = { estado: false };

    if (desde || hasta) {
      whereVentaActiva.fecha = rangoFecha;
      whereCompraActiva.fecha = rangoFecha;
      whereVentaAnulada.fecha = rangoFecha;
      whereCompraAnulada.fecha = rangoFecha;
    }

    const ventasActivasAgg = await prisma.venta.aggregate({
      where: whereVentaActiva,
      _sum: { total: true },
      _count: { id: true }
    });
    
    const comprasActivasAgg = await prisma.compra.aggregate({
      where: whereCompraActiva,
      _sum: { total: true },
      _count: { id: true }
    });

    const ventasAnuladasCount = await prisma.venta.count({ where: whereVentaAnulada });
    const comprasAnuladasCount = await prisma.compra.count({ where: whereCompraAnulada });

    // Sumar ganancias específicas de animales
    const gananciaGanadoAgg = await prisma.detalleVenta.aggregate({
      where: { venta: whereVentaActiva, gananciaAnimal: { not: null } },
      _sum: { gananciaAnimal: true, precioCompraAnimal: true, subtotal: true },
      _count: { id: true }
    });

    const totalVentasActivas = ventasActivasAgg._sum.total || 0;
    const totalComprasActivas = comprasActivasAgg._sum.total || 0;
    const gananciaEstimada = totalVentasActivas - totalComprasActivas;

    const gananciaGanado = gananciaGanadoAgg._sum.gananciaAnimal || 0;
    const costoGanadoVendido = gananciaGanadoAgg._sum.precioCompraAnimal || 0;
    const ingresoGanadoCompradoVendido = gananciaGanadoAgg._sum.subtotal || 0;
    const cantidadAnimalesCompradosVendidos = gananciaGanadoAgg._count.id || 0;

    return {
      totalVentasActivas,
      totalComprasActivas,
      gananciaEstimada,
      gananciaGanado,
      costoGanadoVendido,
      ingresoGanadoCompradoVendido,
      cantidadAnimalesCompradosVendidos,
      cantidadVentasActivas: ventasActivasAgg._count.id || 0,
      cantidadComprasActivas: comprasActivasAgg._count.id || 0,
      cantidadVentasAnuladas: ventasAnuladasCount,
      cantidadComprasAnuladas: comprasAnuladasCount,
      periodoDesde: desde || null,
      periodoHasta: hasta || null
    };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE STOCK BAJO
  // ─────────────────────────────────────────────────────────────
  async getStockBajoReport(umbral = STOCK_BAJO_UMBRAL) {
    const umbralNum = parseFloat(umbral) || STOCK_BAJO_UMBRAL;

    const alimentosBajos = await prisma.alimento.findMany({
      where: { estado: true, stockCantidad: { lte: umbralNum } },
      orderBy: { stockCantidad: 'asc' }
    });

    const medicamentosBajos = await prisma.medicamento.findMany({
      where: { estado: true, stockCantidad: { lte: umbralNum } },
      orderBy: { stockCantidad: 'asc' }
    });

    return {
      alimentosBajos,
      medicamentosBajos,
      totalAlertas: alimentosBajos.length + medicamentosBajos.length,
      umbral: umbralNum
    };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE CLIENTES (NUEVO FASE 9D-1)
  // ─────────────────────────────────────────────────────────────
  async getClientsReport({ estado, search } = {}) {
    const where = {};
    if (estado === 'activo') {
      where.estado = true;
    } else if (estado === 'inactivo') {
      where.estado = false;
    }
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
        { direccion: { contains: search, mode: 'insensitive' } }
      ];
    }

    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        ventas: { select: { estado: true, total: true, fecha: true } }
      },
      orderBy: { nombre: 'asc' }
    });

    const data = clientes.map(c => {
      const ventasActivas = c.ventas.filter(v => v.estado === true);
      const ventasAnuladas = c.ventas.filter(v => v.estado === false);
      const totalVentasActivas = ventasActivas.reduce((sum, v) => sum + v.total, 0);
      
      let ultimaVenta = null;
      if (c.ventas.length > 0) {
        ultimaVenta = c.ventas.reduce((latest, v) => v.fecha > latest.fecha ? v : latest).fecha;
      }

      return {
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono || '—',
        direccion: c.direccion || '—',
        estado: c.estado,
        cantidadVentasActivas: ventasActivas.length,
        totalVentasActivas,
        cantidadVentasAnuladas: ventasAnuladas.length,
        ultimaVenta
      };
    });

    return { clientes: data };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE PROVEEDORES (NUEVO FASE 9D-1)
  // ─────────────────────────────────────────────────────────────
  async getProvidersReport({ estado, search } = {}) {
    const where = {};
    if (estado === 'activo') {
      where.estado = true;
    } else if (estado === 'inactivo') {
      where.estado = false;
    }
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
        { direccion: { contains: search, mode: 'insensitive' } }
      ];
    }

    const proveedores = await prisma.proveedor.findMany({
      where,
      include: {
        compras: { select: { estado: true, total: true, fecha: true } }
      },
      orderBy: { nombre: 'asc' }
    });

    const data = proveedores.map(p => {
      const comprasActivas = p.compras.filter(c => c.estado === true);
      const comprasAnuladas = p.compras.filter(c => c.estado === false);
      const totalComprasActivas = comprasActivas.reduce((sum, c) => sum + c.total, 0);
      
      let ultimaCompra = null;
      if (p.compras.length > 0) {
        ultimaCompra = p.compras.reduce((latest, c) => c.fecha > latest.fecha ? c : latest).fecha;
      }

      return {
        id: p.id,
        nombre: p.nombre,
        telefono: p.telefono || '—',
        direccion: p.direccion || '—',
        estado: p.estado,
        cantidadComprasActivas: comprasActivas.length,
        totalComprasActivas,
        cantidadComprasAnuladas: comprasAnuladas.length,
        ultimaCompra
      };
    });

    return { proveedores: data };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE ANIMALES (NUEVO FASE 9D-2)
  // ─────────────────────────────────────────────────────────────
  async getAnimalsReport({ estado, search, categoriaId, razaId } = {}) {
    const where = {};
    if (estado === 'ACTIVOS') {
      where.estado = true;
      where.vendido = false;
    } else if (estado === 'VENDIDOS') {
      where.vendido = true;
    } else if (estado === 'INACTIVOS') {
      where.estado = false;
      where.vendido = false;
    }
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { nroArete: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (categoriaId) where.categoriaId = parseInt(categoriaId);
    if (razaId) where.razaId = parseInt(razaId);

    const animales = await prisma.animal.findMany({
      where,
      include: {
        categoria: { select: { nombre: true } },
        raza: { select: { nombre: true } },
        padre: { select: { nombre: true, nroArete: true } },
        madre: { select: { nombre: true, nroArete: true } },
        movimientos: {
          orderBy: { fechaIngreso: 'desc' },
          take: 1,
          include: { parcela: { select: { nombre: true } } }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    const data = animales.map(a => {
      let estadoGanadero = 'ACTIVO';
      if (a.vendido) estadoGanadero = 'VENDIDO';
      else if (!a.estado) estadoGanadero = 'INACTIVO';

      let parcelaActual = '—';
      if (a.movimientos && a.movimientos.length > 0) {
        const mov = a.movimientos[0];
        parcelaActual = mov.parcela?.nombre || '—';
      }

      return {
        id: a.id,
        nombre: a.nombre,
        arete: a.nroArete,
        sexo: a.sexo,
        categoria: a.categoria?.nombre || '—',
        raza: a.raza?.nombre || '—',
        peso: a.peso || 0,
        estadoGanadero,
        estado: a.estado,
        vendido: a.vendido,
        fechaRegistro: a.fechaNacimiento || a.fechaIngreso,
        padre: a.padre ? `${a.padre.nroArete} - ${a.padre.nombre}` : '—',
        madre: a.madre ? `${a.madre.nroArete} - ${a.madre.nombre}` : '—',
        parcelaActual,
        observacion: a.observacion || '—'
      };
    });

    return { animales: data, total: data.length };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE ALIMENTACION (NUEVO FASE 9D-2)
  // ─────────────────────────────────────────────────────────────
  async getFeedingReport({ estado, animalId, alimentoId, desde, hasta, search } = {}) {
    const where = {};
    if (estado === 'ACTIVAS') {
      where.estado = true;
    } else if (estado === 'ANULADAS') {
      where.estado = false;
    }
    
    if (animalId) where.animalId = parseInt(animalId);
    if (alimentoId) where.alimentoId = parseInt(alimentoId);
    
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) {
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        where.fecha.lte = fin;
      }
    }

    if (search) {
      where.OR = [
        { observacion: { contains: search, mode: 'insensitive' } },
        { animal: { nombre: { contains: search, mode: 'insensitive' } } },
        { animal: { nroArete: { contains: search, mode: 'insensitive' } } },
        { alimento: { nombre: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const alimentaciones = await prisma.alimentacion.findMany({
      where,
      include: {
        animal: { select: { nombre: true, nroArete: true } },
        alimento: { select: { nombre: true, unidadMedida: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    const data = alimentaciones.map(a => {
      return {
        id: a.id,
        fecha: a.fecha,
        animal: a.animal?.nombre || '—',
        arete: a.animal?.nroArete || '—',
        alimento: a.alimento?.nombre || '—',
        cantidad: a.cantidad || 0,
        unidad: a.alimento?.unidadMedida || '—',
        estado: a.estado ? 'ACTIVA' : 'ANULADA',
        observacion: a.observacion || '—',
        fechaAnulacion: a.fechaAnulacion || null,
        motivoAnulacion: a.motivoAnulacion || '—'
      };
    });

    return { alimentaciones: data, total: data.length };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE MOVIMIENTOS ANIMALES (NUEVO FASE 9D-2)
  // ─────────────────────────────────────────────────────────────
  async getAnimalMovementsReport({ estadoMovimiento, animalId, parcelaId, desde, hasta, search } = {}) {
    const where = {};
    if (estadoMovimiento === 'ACTUALES') {
      where.fechaSalida = null;
    } else if (estadoMovimiento === 'HISTORICOS') {
      where.fechaSalida = { not: null };
    }
    
    if (animalId) where.animalId = parseInt(animalId);
    if (parcelaId) where.parcelaId = parseInt(parcelaId);
    
    if (desde || hasta) {
      where.fechaIngreso = {};
      if (desde) where.fechaIngreso.gte = new Date(desde);
      if (hasta) {
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        where.fechaIngreso.lte = fin;
      }
    }

    if (search) {
      where.OR = [
        { animal: { nombre: { contains: search, mode: 'insensitive' } } },
        { animal: { nroArete: { contains: search, mode: 'insensitive' } } },
        { parcela: { nombre: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const movimientos = await prisma.movimiento.findMany({
      where,
      include: {
        animal: { select: { nombre: true, nroArete: true, estado: true, vendido: true } },
        parcela: { select: { nombre: true } }
      },
      orderBy: { fechaIngreso: 'desc' }
    });

    const data = movimientos.map(m => {
      let estadoAnimal = 'ACTIVO';
      if (m.animal?.vendido) estadoAnimal = 'VENDIDO';
      else if (m.animal && !m.animal.estado) estadoAnimal = 'INACTIVO';

      const hoy = new Date();
      const ingreso = new Date(m.fechaIngreso);
      const salida = m.fechaSalida ? new Date(m.fechaSalida) : hoy;
      
      const diffTime = Math.abs(salida - ingreso);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: m.id,
        animal: m.animal?.nombre || '—',
        arete: m.animal?.nroArete || '—',
        parcela: m.parcela?.nombre || '—',
        fechaIngreso: m.fechaIngreso,
        fechaSalida: m.fechaSalida,
        estadoMovimiento: m.fechaSalida === null ? 'ACTUAL' : 'HISTORICO',
        diasEnParcela: diffDays,
        estadoAnimal,
        vendido: m.animal?.vendido || false
      };
    });

    return { movimientos: data, total: data.length };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE INVENTARIO PROFESIONAL (FASE 9D-3)
  // ─────────────────────────────────────────────────────────────
  async getInventoryReport({ tipo, estado, alerta, search } = {}) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite30 = new Date(hoy);
    limite30.setDate(limite30.getDate() + 30);

    const whereAlimento = {};
    const whereMedicamento = {};

    if (estado === 'ACTIVOS') {
      whereAlimento.estado = true;
      whereMedicamento.estado = true;
    } else if (estado === 'INACTIVOS') {
      whereAlimento.estado = false;
      whereMedicamento.estado = false;
    }

    if (search) {
      const searchCond = {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } }
        ]
      };
      Object.assign(whereAlimento, searchCond);
      Object.assign(whereMedicamento, searchCond);
    }

    let alimentos = [];
    let medicamentos = [];

    if (!tipo || tipo === 'TODOS' || tipo === 'ALIMENTO') {
      alimentos = await prisma.alimento.findMany({ where: whereAlimento });
    }
    if (!tipo || tipo === 'TODOS' || tipo === 'MEDICAMENTO') {
      medicamentos = await prisma.medicamento.findMany({ where: whereMedicamento });
    }

    const processItem = (item, tipoItem) => {
      const stock = Number(item.stockCantidad || 0);
      const precio = Number(item.precioCompra || 0);
      const valorEstimado = stock * precio;
      const vDate = item.fechaVencimiento ? new Date(item.fechaVencimiento) : null;

      let alertaItem = 'NORMAL';
      if (!item.estado) {
        alertaItem = 'INACTIVO';
      } else if (stock <= 0) {
        alertaItem = 'SIN STOCK';
      } else if (vDate && vDate < hoy) {
        alertaItem = 'VENCIDO';
      } else if (vDate && vDate >= hoy && vDate <= limite30) {
        alertaItem = 'POR VENCER';
      } else if (stock > 0 && stock < 50) {
        alertaItem = 'STOCK BAJO';
      }

      return {
        id: item.id,
        tipo: tipoItem,
        nombre: item.nombre,
        descripcion: item.descripcion || '—',
        stock,
        unidad: item.unidadMedida || '—',
        precioCompra: precio,
        valorEstimado,
        fechaVencimiento: item.fechaVencimiento || null,
        estado: item.estado ? 'ACTIVO' : 'INACTIVO',
        alerta: alertaItem
      };
    };

    let data = [
      ...alimentos.map(a => processItem(a, 'ALIMENTO')),
      ...medicamentos.map(m => processItem(m, 'MEDICAMENTO'))
    ];

    if (alerta && alerta !== 'TODAS') {
      data = data.filter(d => d.alerta === alerta);
    }

    data.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return { inventario: data, total: data.length };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE KARDEX / MOVIMIENTOS INVENTARIO (FASE 9D-3)
  // ─────────────────────────────────────────────────────────────
  async getKardexReport({ tipo, origen, itemTipo, desde, hasta, search } = {}) {
    const where = {};
    if (tipo && tipo !== 'TODOS') where.tipo = tipo;
    if (origen) where.origen = origen;
    
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) {
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        where.fecha.lte = fin;
      }
    }

    if (itemTipo === 'ALIMENTO') {
      where.alimentoId = { not: null };
    } else if (itemTipo === 'MEDICAMENTO') {
      where.medicamentoId = { not: null };
    }

    if (search) {
      where.OR = [
        { motivo: { contains: search, mode: 'insensitive' } },
        { alimento: { nombre: { contains: search, mode: 'insensitive' } } },
        { medicamento: { nombre: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        alimento: { select: { nombre: true } },
        medicamento: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    const data = movimientos.map(m => {
      let insumo = '—';
      let iTipo = '—';
      if (m.alimento) {
        insumo = m.alimento.nombre;
        iTipo = 'ALIMENTO';
      } else if (m.medicamento) {
        insumo = m.medicamento.nombre;
        iTipo = 'MEDICAMENTO';
      }

      return {
        id: m.id,
        fecha: m.fecha,
        tipo: m.tipo,
        origen: m.origen || '—',
        itemTipo: iTipo,
        insumo,
        cantidad: Number(m.cantidad || 0),
        stockPrevio: Number(m.stockPrevio || 0),
        stockPosterior: Number(m.stockPosterior || 0),
        motivo: m.motivo || '—',
        referenciaTipo: m.referenciaTipo || '—',
        referenciaId: m.referenciaId || '—'
      };
    });

    return { kardex: data, total: data.length };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE STOCK BAJO / VENCIMIENTOS (FASE 9D-3)
  // ─────────────────────────────────────────────────────────────
  async getStockAlertsReport({ tipo, alerta, search } = {}) {
    const reportData = await this.getInventoryReport({ tipo, estado: 'ACTIVOS', search });
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let alertas = reportData.inventario.filter(item => 
      ['SIN STOCK', 'STOCK BAJO', 'VENCIDO', 'POR VENCER'].includes(item.alerta)
    );

    if (alerta && alerta !== 'TODAS') {
      alertas = alertas.filter(item => item.alerta === alerta);
    }

    const data = alertas.map(item => {
      let diasParaVencer = '—';
      if (item.fechaVencimiento) {
        const vDate = new Date(item.fechaVencimiento);
        vDate.setHours(0, 0, 0, 0);
        const diffTime = vDate - hoy;
        diasParaVencer = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        ...item,
        diasParaVencer
      };
    });

    return { alertas: data, total: data.length };
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTE SANIDAD PROFESIONAL (FASE 9D-3)
  // ─────────────────────────────────────────────────────────────
  async getSanidadReport({ animalId, veterinarioId, estadoTratamiento, estadoDosis, desde, hasta, search } = {}) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(hoy);
    finHoy.setHours(23, 59, 59, 999);

    const where = {};
    if (animalId) where.animalId = parseInt(animalId);
    if (veterinarioId) where.veterinarioId = parseInt(veterinarioId);

    if (estadoTratamiento === 'ANULADO') {
      where.estado = false;
    } else if (estadoTratamiento === 'CONCLUIDO') {
      where.estado = true;
      where.fechaFin = { not: null };
    } else if (estadoTratamiento === 'EN CURSO') {
      where.estado = true;
      where.fechaFin = null;
    }

    if (desde || hasta) {
      where.fechaInicio = {};
      if (desde) where.fechaInicio.gte = new Date(desde);
      if (hasta) {
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        where.fechaInicio.lte = fin;
      }
    }

    if (search) {
      where.OR = [
        { animal: { nombre: { contains: search, mode: 'insensitive' } } },
        { animal: { nroArete: { contains: search, mode: 'insensitive' } } },
        { veterinario: { nombre: { contains: search, mode: 'insensitive' } } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { diagnostico: { contains: search, mode: 'insensitive' } }
      ];
    }

    const tratamientos = await prisma.tratamiento.findMany({
      where,
      include: {
        animal: { select: { nombre: true, nroArete: true } },
        veterinario: { select: { nombre: true } },
        aplicaciones: {
          include: { medicamento: { select: { nombre: true } } },
          orderBy: { fecha: 'asc' }
        }
      },
      orderBy: { fechaInicio: 'desc' }
    });

    let data = [];

    tratamientos.forEach(t => {
      let estTratamiento = 'EN CURSO';
      if (!t.estado) estTratamiento = 'ANULADO';
      else if (t.fechaFin) estTratamiento = 'CONCLUIDO';

      const baseRow = {
        tratamientoId: t.id,
        animal: t.animal?.nombre || '—',
        arete: t.animal?.nroArete || '—',
        veterinario: t.veterinario?.nombre || '—',
        tipo: t.tipo || '—',
        descripcion: t.descripcion || '—',
        diagnostico: t.diagnostico || '—',
        fechaInicio: t.fechaInicio,
        fechaFin: t.fechaFin || null,
        estadoTratamiento: estTratamiento,
        motivoAnulacion: t.motivoAnulacion || '—'
      };

      if (!t.aplicaciones || t.aplicaciones.length === 0) {
        data.push({
          ...baseRow,
          medicamento: '—',
          cantidadAplicada: '—',
          fechaAplicacion: '—',
          proximaDosis: null,
          estadoDosis: 'SIN PROGRAMAR',
          observacionAplicacion: '—'
        });
      } else {
        t.aplicaciones.forEach(app => {
          let estDosis = 'SIN PROGRAMAR';
          if (app.fechaSiguiente) {
            const nextD = new Date(app.fechaSiguiente);
            if (nextD < hoy) estDosis = 'ATRASADA';
            else if (nextD >= hoy && nextD <= finHoy) estDosis = 'HOY';
            else estDosis = 'PROXIMA';
          }

          data.push({
            ...baseRow,
            medicamento: app.medicamento?.nombre || '—',
            cantidadAplicada: Number(app.dosis || 0),
            fechaAplicacion: app.fecha || '—',
            proximaDosis: app.fechaSiguiente || null,
            estadoDosis: estDosis,
            observacionAplicacion: app.observacion || '—'
          });
        });
      }
    });

    if (estadoDosis && estadoDosis !== 'TODAS') {
      data = data.filter(d => d.estadoDosis === estadoDosis);
    }

    return { sanidad: data, total: data.length };
  }

  // ─────────────────────────────────────────────────────────────
  // Métodos legacy (compatibilidad hacia atrás)
  // ─────────────────────────────────────────────────────────────
  async getSalesAggregation() {
    return this.getSalesReport({});
  }

  async getPurchasesAggregation() {
    return this.getPurchasesReport({});
  }

  async getInventoryMetrics() {
    return this.getInventoryReport({});
  }
}

module.exports = PrismaReportesRepository;
