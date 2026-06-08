const IInventarioRepository = require('../domain/IInventarioRepository');
const prisma = require('../../../shared/infrastructure/persistence/prisma');

class PrismaInventarioRepository extends IInventarioRepository {
  async saveAlimento(data) {
    return await prisma.alimento.create({ data });
  }

  async findAllAlimentos() {
    return await prisma.alimento.findMany({
      orderBy: { nombre: 'asc' }
    });
  }

  async findAllMedicamentos() {
    return await prisma.medicamento.findMany({
      orderBy: { nombre: 'asc' }
    });
  }

  async findAlimentoById(id) {
    return await prisma.alimento.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async findAlimentoByNombre(nombre) {
    return await prisma.alimento.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive'
        }
      }
    });
  }

  async updateAlimento(id, data) {
    return await prisma.alimento.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async changeAlimentoStatus(id, status) {
    return await prisma.alimento.update({
      where: { id: parseInt(id) },
      data: { estado: status }
    });
  }

  async saveMedicamento(data) {
    return await prisma.medicamento.create({ data });
  }

  async findMedicamentoById(id) {
    return await prisma.medicamento.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async findMedicamentoByNombre(nombre) {
    return await prisma.medicamento.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive'
        }
      }
    });
  }

  async updateMedicamento(id, data) {
    return await prisma.medicamento.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async changeMedicamentoStatus(id, status) {
    return await prisma.medicamento.update({
      where: { id: parseInt(id) },
      data: { estado: status }
    });
  }

  async findMovimientosInventario(filters = {}) {
    const { itemTipo, tipo, origen, alimentoId, medicamentoId, desde, hasta } = filters;
    
    const where = {};
    if (itemTipo) where.itemTipo = itemTipo;
    if (tipo) where.tipo = tipo;
    if (origen) where.origen = origen;
    if (alimentoId) where.alimentoId = parseInt(alimentoId);
    if (medicamentoId) where.medicamentoId = parseInt(medicamentoId);
    
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) where.fecha.lte = new Date(hasta);
    }

    return await prisma.movimientoInventario.findMany({
      where,
      include: {
        alimento: { select: { nombre: true } },
        medicamento: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });
  }

  async _createMovimientoInventario(tx, data) {
    return await tx.movimientoInventario.create({ data });
  }

  async registrarAlimentacion(data) {
    const { animalId, alimentoId, cantidad, observacion } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Validar Alimento y Stock
      const alimento = await tx.alimento.findUnique({
        where: { id: parseInt(alimentoId) }
      });

      if (!alimento) throw new Error('Alimento no encontrado');
      if (!alimento.estado) throw new Error('El alimento no está activo');

      // Validar Vencimiento
      if (alimento.fechaVencimiento) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const vDate = new Date(alimento.fechaVencimiento);
        if (vDate < today) {
          throw new Error('El alimento está vencido y no puede ser suministrado.');
        }
      }
      
      if (alimento.stockCantidad < cantidad) {
        throw new Error(`Stock insuficiente. Disponible: ${alimento.stockCantidad} ${alimento.unidadMedida}`);
      }

      // 2. Validar Animal
      const animal = await tx.animal.findUnique({
        where: { id: parseInt(animalId) }
      });

      if (!animal) throw new Error('Animal no encontrado');
      if (!animal.estado) throw new Error('El animal no está activo');
      if (animal.vendido) throw new Error('El animal ya fue vendido');

      // 3. Descontar Stock
      const stockPrevio = alimento.stockCantidad;
      const stockPosterior = stockPrevio - cantidad;

      await tx.alimento.update({
        where: { id: alimento.id },
        data: { stockCantidad: stockPosterior }
      });

      // 4. Registrar Alimentación
      const alimentacion = await tx.alimentacion.create({
        data: {
          cantidad: parseFloat(cantidad),
          observacion: observacion || null,
          estado: true,
          animal: { connect: { id: animal.id } },
          alimento: { connect: { id: alimento.id } }
        },
        include: {
          animal: { select: { nombre: true, nroArete: true } },
          alimento: { select: { nombre: true, unidadMedida: true } }
        }
      });

      // 5. Registrar Movimiento de Inventario
      await this._createMovimientoInventario(tx, {
        tipo: 'SALIDA',
        origen: 'ALIMENTACION',
        itemTipo: 'ALIMENTO',
        alimentoId: alimento.id,
        cantidad: parseFloat(cantidad),
        unidadMedida: alimento.unidadMedida,
        stockPrevio,
        stockPosterior,
        motivo: observacion || "Suministro de alimento",
        referenciaId: alimentacion.id,
        referenciaTipo: "Alimentacion"
      });

      return alimentacion;
    });
  }

  async annulAlimentacion(id, motivoAnulacion) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar y validar registro
      const alimentacion = await tx.alimentacion.findUnique({
        where: { id },
        include: { alimento: true }
      });

      if (!alimentacion) {
        throw new Error('Registro de alimentación no encontrado.');
      }

      if (alimentacion.estado === false) {
        throw new Error('La alimentación ya fue anulada.');
      }

      // 2. Revertir stock al alimento
      const stockPrevio = alimentacion.alimento.stockCantidad;
      const stockPosterior = stockPrevio + alimentacion.cantidad;

      await tx.alimento.update({
        where: { id: alimentacion.alimentoId },
        data: { stockCantidad: stockPosterior }
      });

      // 3. Marcar como anulado
      const alimentacionActualizada = await tx.alimentacion.update({
        where: { id },
        data: {
          estado: false,
          fechaAnulacion: new Date(),
          motivoAnulacion: motivoAnulacion?.trim() || null
        },
        include: {
          animal: { select: { nombre: true, nroArete: true } },
          alimento: { select: { nombre: true, unidadMedida: true } }
        }
      });

      // 4. Registrar Movimiento de Inventario
      await this._createMovimientoInventario(tx, {
        tipo: 'REVERSION',
        origen: 'ANULACION_ALIMENTACION',
        itemTipo: 'ALIMENTO',
        alimentoId: alimentacion.alimentoId,
        cantidad: alimentacion.cantidad,
        unidadMedida: alimentacion.alimento.unidadMedida,
        stockPrevio,
        stockPosterior,
        motivo: motivoAnulacion || "Anulación de alimentación",
        referenciaId: alimentacion.id,
        referenciaTipo: "Alimentacion"
      });

      return alimentacionActualizada;
    });
  }

  async findAlimentacionByAnimal(animalId) {
    return await prisma.alimentacion.findMany({
      where: { animalId: parseInt(animalId) },
      include: {
        animal: {
          select: { nombre: true, nroArete: true }
        },
        alimento: {
          select: { nombre: true, unidadMedida: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });
  }

  async getResumen() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);

    const [alimentos, medicamentos] = await Promise.all([
      prisma.alimento.findMany(),
      prisma.medicamento.findMany()
    ]);

    const res = {
      resumen: {
        totalAlimentos: alimentos.length,
        totalMedicamentos: medicamentos.length,
        alimentosActivos: alimentos.filter(a => a.estado).length,
        medicamentosActivos: medicamentos.filter(m => m.estado).length,
        stockBajo: 0,
        sinStock: 0,
        vencidos: 0,
        porVencer: 0,
        valorEstimado: 0
      },
      alertas: {
        criticas: [],
        advertencias: []
      }
    };

    const processItem = (item, tipo) => {
      // 1. Valor Estimado (solo activos con precio)
      if (item.estado && item.precioCompra && item.stockCantidad > 0) {
        res.resumen.valorEstimado += (item.stockCantidad * item.precioCompra);
      }

      // Solo procesar alertas para activos
      if (!item.estado) return;

      const vDate = item.fechaVencimiento ? new Date(item.fechaVencimiento) : null;
      
      let esCritico = false;

      // 2. Alertas Críticas (Prioridad 1)
      if (item.stockCantidad <= 0) {
        res.resumen.sinStock++;
        res.alertas.criticas.push({ ...item, itemTipo: tipo, motivo: 'SIN_STOCK' });
        esCritico = true;
      } else if (vDate && vDate < today) {
        res.resumen.vencidos++;
        res.alertas.criticas.push({ ...item, itemTipo: tipo, motivo: 'VENCIDO' });
        esCritico = true;
      }

      // 3. Advertencias (Solo si no es crítico)
      if (!esCritico) {
        if (item.stockCantidad < 50) {
          res.resumen.stockBajo++;
          res.alertas.advertencias.push({ ...item, itemTipo: tipo, motivo: 'STOCK_BAJO' });
        } else if (vDate && vDate <= in30Days) {
          res.resumen.porVencer++;
          res.alertas.advertencias.push({ ...item, itemTipo: tipo, motivo: 'POR_VENCER' });
        }
      }
    };

    alimentos.forEach(a => processItem(a, 'ALIMENTO'));
    medicamentos.forEach(m => processItem(m, 'MEDICAMENTO'));

    return res;
  }
}

module.exports = PrismaInventarioRepository;
