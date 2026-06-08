const ISanidadRepository = require('../domain/ISanidadRepository');
const prisma = require('../../../shared/infrastructure/persistence/prisma');

// Includes reutilizables
const TRATAMIENTO_INCLUDES = {
  animal: { select: { id: true, nombre: true, nroArete: true, estado: true, vendido: true } },
  veterinario: { select: { id: true, nombre: true, email: true, telefono: true } },
  diagnosticos: { orderBy: { fecha: 'asc' } },
  aplicaciones: {
    include: {
      medicamento: { select: { id: true, nombre: true, unidadMedida: true } }
    },
    orderBy: { fecha: 'asc' }
  }
};

class PrismaSanidadRepository extends ISanidadRepository {

  // ── Veterinarios ────────────────────────────────────────────────────────────

  async findAllVeterinarios() {
    return await prisma.veterinario.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { tratamientos: true } }
      }
    });
  }

  async findVeterinarioById(id) {
    return await prisma.veterinario.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: { select: { tratamientos: true } }
      }
    });
  }

  async findVeterinarioByNombre(nombre) {
    return await prisma.veterinario.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive'
        }
      }
    });
  }

  async findVeterinarioByEmail(email) {
    return await prisma.veterinario.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });
  }

  async saveVeterinario(data) {
    return await prisma.veterinario.create({ data });
  }

  async updateVeterinario(id, data) {
    return await prisma.veterinario.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async toggleVeterinarioEstado(id) {
    const vet = await prisma.veterinario.findUnique({ where: { id: parseInt(id) } });
    if (!vet) throw new Error('Veterinario no encontrado');
    return await prisma.veterinario.update({
      where: { id: parseInt(id) },
      data: { estado: !vet.estado }
    });
  }

  // ── Medicamentos ─────────────────────────────────────────────────────────────

  async findAllMedicamentosActivos() {
    return await prisma.medicamento.findMany({
      where: { estado: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, stockCantidad: true, unidadMedida: true, estado: true, fechaVencimiento: true }
    });
  }

  // ── Tratamientos ─────────────────────────────────────────────────────────────

  async findAllTratamientos(filters = {}) {
    const where = {};
    if (filters.animalId) where.animalId = parseInt(filters.animalId);
    if (filters.veterinarioId) where.veterinarioId = parseInt(filters.veterinarioId);
    if (filters.estado !== undefined) where.estado = filters.estado;
    if (filters.desde || filters.hasta) {
      where.fechaInicio = {};
      if (filters.desde) where.fechaInicio.gte = new Date(filters.desde);
      if (filters.hasta) where.fechaInicio.lte = new Date(filters.hasta);
    }

    return await prisma.tratamiento.findMany({
      where,
      include: TRATAMIENTO_INCLUDES,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findTratamientoById(id) {
    return await prisma.tratamiento.findUnique({
      where: { id: parseInt(id) },
      include: TRATAMIENTO_INCLUDES
    });
  }

  async findTratamientosByAnimal(animalId) {
    return await prisma.tratamiento.findMany({
      where: { animalId: parseInt(animalId) },
      include: TRATAMIENTO_INCLUDES,
      orderBy: { createdAt: 'desc' }
    });
  }

  async saveTratamiento(data) {
    return await prisma.tratamiento.create({
      data: {
        descripcion: data.descripcion,
        tipo: data.tipo,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
        animal: { connect: { id: parseInt(data.animalId) } },
        veterinario: { connect: { id: parseInt(data.veterinarioId) } }
      },
      include: TRATAMIENTO_INCLUDES
    });
  }

  async annulTratamiento(id) {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener el tratamiento con sus aplicaciones
      const tratamiento = await tx.tratamiento.findUnique({
        where: { id: parseInt(id) },
        include: { aplicaciones: true }
      });

      if (!tratamiento) throw new Error('Tratamiento no encontrado');
      if (!tratamiento.estado) throw new Error('El tratamiento ya está anulado');

      // 2. Revertir stock para cada aplicación y registrar movimientos
      for (const aplicacion of tratamiento.aplicaciones) {
        const medicamento = await tx.medicamento.findUnique({
          where: { id: aplicacion.medicamentoId }
        });

        if (medicamento) {
          const stockPrevio = medicamento.stockCantidad;
          const stockPosterior = stockPrevio + aplicacion.cantidad;

          await tx.medicamento.update({
            where: { id: aplicacion.medicamentoId },
            data: { stockCantidad: stockPosterior }
          });

          await tx.movimientoInventario.create({
            data: {
              tipo: 'REVERSION',
              origen: 'ANULACION_TRATAMIENTO',
              itemTipo: 'MEDICAMENTO',
              medicamentoId: aplicacion.medicamentoId,
              cantidad: aplicacion.cantidad,
              unidadMedida: medicamento.unidadMedida,
              stockPrevio,
              stockPosterior,
              motivo: "Anulación de tratamiento",
              referenciaId: aplicacion.id,
              referenciaTipo: "AplicacionMedicamento"
            }
          });
        }
      }

      // 3. Marcar tratamiento como inactivo
      return await tx.tratamiento.update({
        where: { id: parseInt(id) },
        data: { estado: false },
        include: TRATAMIENTO_INCLUDES
      });
    });
  }

  async finalizarTratamiento(id) {
    const tratamiento = await prisma.tratamiento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!tratamiento) throw new Error('Tratamiento no encontrado');
    if (!tratamiento.estado) throw new Error('No se puede finalizar un tratamiento anulado.');
    if (tratamiento.fechaFin) throw new Error('El tratamiento ya fue finalizado.');

    const now = new Date();
    const fechaFinLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return await prisma.tratamiento.update({
      where: { id: parseInt(id) },
      data: { fechaFin: fechaFinLocal },
      include: TRATAMIENTO_INCLUDES
    });
  }

  // ── Diagnósticos ─────────────────────────────────────────────────────────────

  async addDiagnostico(data) {
    const tratamiento = await prisma.tratamiento.findUnique({ where: { id: parseInt(data.tratamientoId) } });
    if (!tratamiento) throw new Error('Tratamiento no encontrado');
    if (!tratamiento.estado) throw new Error('No se puede agregar diagnóstico a un tratamiento anulado.');
    if (tratamiento.fechaFin) throw new Error('No se puede agregar diagnóstico a un tratamiento concluido.');

    return await prisma.diagnostico.create({
      data: {
        descripcion: data.descripcion,
        tratamiento: { connect: { id: parseInt(data.tratamientoId) } }
      }
    });
  }

  // ── Aplicaciones de Medicamento ───────────────────────────────────────────────

  async aplicarMedicamento(data) {
    const { tratamientoId, medicamentoId, dosis, cantidad, fechaSiguiente, fechaAdministracion } = data;
    const cantidadNum = parseFloat(cantidad);

    return await prisma.$transaction(async (tx) => {
      // 1. Validar tratamiento activo
      const tratamiento = await tx.tratamiento.findUnique({
        where: { id: parseInt(tratamientoId) },
        include: { animal: true }
      });
      if (!tratamiento) throw new Error('Tratamiento no encontrado');
      if (!tratamiento.estado) throw new Error('No se puede aplicar medicamentos a un tratamiento anulado.');
      if (tratamiento.fechaFin) throw new Error('No se puede aplicar medicamentos a un tratamiento concluido.');

      // 2. Validar animal activo y no vendido
      const animal = tratamiento.animal;
      if (!animal.estado) throw new Error('El animal no está activo');
      if (animal.vendido) throw new Error('El animal ya fue vendido');

      // 3. Validar medicamento activo y con stock suficiente
      const medicamento = await tx.medicamento.findUnique({
        where: { id: parseInt(medicamentoId) }
      });
      if (!medicamento) throw new Error('Medicamento no encontrado');
      if (!medicamento.estado) throw new Error('El medicamento está inactivo');

      const adminDate = fechaAdministracion ? new Date(fechaAdministracion) : new Date();
      if (medicamento.fechaVencimiento && new Date(medicamento.fechaVencimiento) < adminDate) {
        throw new Error('El medicamento está vencido y no puede ser aplicado.');
      }

      if (medicamento.stockCantidad < cantidadNum) {
        throw new Error(`Stock insuficiente. Disponible: ${medicamento.stockCantidad} ${medicamento.unidadMedida}`);
      }

      // 4. Descontar stock por la cantidad real y registrar movimiento
      const stockPrevio = medicamento.stockCantidad;
      const stockPosterior = stockPrevio - cantidadNum;

      await tx.medicamento.update({
        where: { id: medicamento.id },
        data: { stockCantidad: stockPosterior }
      });

      // 5. Registrar aplicación
      const application = await tx.aplicacionMedicamento.create({
        data: {
          dosis,
          cantidad: cantidadNum,
          fecha: adminDate,
          fechaSiguiente,
          tratamiento: { connect: { id: parseInt(tratamientoId) } },
          medicamento: { connect: { id: medicamento.id } }
        },
        include: {
          medicamento: { select: { id: true, nombre: true, unidadMedida: true, stockCantidad: true } }
        }
      });

      // 6. Registrar Movimiento de Inventario
      await tx.movimientoInventario.create({
        data: {
          tipo: 'SALIDA',
          origen: 'SANIDAD',
          itemTipo: 'MEDICAMENTO',
          medicamentoId: medicamento.id,
          cantidad: cantidadNum,
          unidadMedida: medicamento.unidadMedida,
          stockPrevio,
          stockPosterior,
          motivo: dosis || "Aplicación de medicamento",
          referenciaId: application.id,
          referenciaTipo: "AplicacionMedicamento"
        }
      });

      return application;
    });
  }

  // ── Calendario Sanitario ─────────────────────────────────────────────────────

  async findCalendarioSanitario(filters = {}) {
    const where = {
      fechaSiguiente: { not: null },
      tratamiento: {
        estado: true, // No anulados
        fechaFin: null, // No concluidos
        animal: {
          estado: true, // Animal activo
          vendido: false // Animal no vendido
        }
      }
    };

    if (filters.desde || filters.hasta) {
      where.fechaSiguiente = { not: null }; // preserve not null
      if (filters.desde) {
        where.fechaSiguiente.gte = new Date(filters.desde);
      }
      if (filters.hasta) {
        const hastaDate = new Date(filters.hasta);
        hastaDate.setHours(23, 59, 59, 999);
        where.fechaSiguiente.lte = hastaDate;
      }
    }

    if (filters.animalId) {
      where.tratamiento.animalId = parseInt(filters.animalId);
    }

    if (filters.veterinarioId) {
      where.tratamiento.veterinarioId = parseInt(filters.veterinarioId);
    }

    if (filters.medicamentoId) {
      where.medicamentoId = parseInt(filters.medicamentoId);
    }

    return await prisma.aplicacionMedicamento.findMany({
      where,
      include: {
        medicamento: true,
        tratamiento: {
          include: {
            animal: true,
            veterinario: true
          }
        }
      },
      orderBy: { fechaSiguiente: 'asc' }
    });
  }

  // ── Alertas Sanitarias ────────────────────────────────────────────────────────

  async getAlertas() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);
    next30Days.setHours(23, 59, 59, 999);

    // 1. Dosis
    const dosisBaseWhere = {
      fechaSiguiente: { not: null },
      tratamiento: {
        estado: true,
        fechaFin: null,
        animal: {
          estado: true,
          vendido: false
        }
      }
    };

    const includeDosis = {
      medicamento: true,
      tratamiento: {
        include: {
          animal: true,
          veterinario: true
        }
      }
    };

    const dosisVencidas = await prisma.aplicacionMedicamento.findMany({
      where: { ...dosisBaseWhere, fechaSiguiente: { lt: today } },
      include: includeDosis,
      orderBy: { fechaSiguiente: 'asc' }
    });

    const dosisHoy = await prisma.aplicacionMedicamento.findMany({
      where: { ...dosisBaseWhere, fechaSiguiente: { gte: today, lte: todayEnd } },
      include: includeDosis,
      orderBy: { fechaSiguiente: 'asc' }
    });

    const proximasDosis = await prisma.aplicacionMedicamento.findMany({
      where: { ...dosisBaseWhere, fechaSiguiente: { gt: todayEnd, lte: next7Days } },
      include: includeDosis,
      orderBy: { fechaSiguiente: 'asc' }
    });

    // 2. Inventario (Medicamentos)
    const baseMedicamentoWhere = { estado: true };

    const medicamentosVencidos = await prisma.medicamento.findMany({
      where: { ...baseMedicamentoWhere, fechaVencimiento: { lt: today } },
      orderBy: { fechaVencimiento: 'asc' }
    });

    const medicamentosPorVencer = await prisma.medicamento.findMany({
      where: { ...baseMedicamentoWhere, fechaVencimiento: { gte: today, lte: next30Days } },
      orderBy: { fechaVencimiento: 'asc' }
    });

    const stockBajo = await prisma.medicamento.findMany({
      where: { ...baseMedicamentoWhere, stockCantidad: { lt: 50 } },
      orderBy: { stockCantidad: 'asc' }
    });

    // Mapear días faltantes/vencidos
    const calcDias = (fecha) => {
      const d = new Date(fecha);
      d.setHours(0, 0, 0, 0);
      const diffTime = d.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const mapDosis = (d) => ({
      id: d.id,
      fechaSiguiente: d.fechaSiguiente,
      fechaAplicacion: d.fecha,
      diasRestantes: calcDias(d.fechaSiguiente),
      medicamento: {
        id: d.medicamento.id,
        nombre: d.medicamento.nombre,
        unidadMedida: d.medicamento.unidadMedida
      },
      animal: {
        id: d.tratamiento.animal.id,
        nombre: d.tratamiento.animal.nombre,
        nroArete: d.tratamiento.animal.nroArete
      },
      tratamiento: {
        id: d.tratamiento.id,
        descripcion: d.tratamiento.descripcion
      },
      veterinario: {
        id: d.tratamiento.veterinario.id,
        nombre: d.tratamiento.veterinario.nombre
      },
      dosis: d.dosis,
      cantidad: d.cantidad
    });

    const mapMedicamento = (m) => ({
      id: m.id,
      nombre: m.nombre,
      stockCantidad: m.stockCantidad,
      unidadMedida: m.unidadMedida,
      fechaVencimiento: m.fechaVencimiento,
      diasRestantes: m.fechaVencimiento ? calcDias(m.fechaVencimiento) : null
    });

    const resDosisVencidas = dosisVencidas.map(mapDosis).map(d => ({ ...d, diasAtraso: Math.abs(d.diasRestantes) }));
    const resDosisHoy = dosisHoy.map(mapDosis);
    const resProximasDosis = proximasDosis.map(mapDosis);

    const resMedVencidos = medicamentosVencidos.map(mapMedicamento).map(m => ({ ...m, diasVencido: Math.abs(m.diasRestantes) }));
    const resMedPorVencer = medicamentosPorVencer.map(mapMedicamento);
    const resStockBajo = stockBajo.map(mapMedicamento);

    return {
      dosis: {
        vencidas: resDosisVencidas,
        hoy: resDosisHoy,
        proximas: resProximasDosis
      },
      inventario: {
        medicamentosVencidos: resMedVencidos,
        medicamentosPorVencer: resMedPorVencer,
        stockBajo: resStockBajo
      },
      resumen: {
        totalDosisVencidas: resDosisVencidas.length,
        totalDosisHoy: resDosisHoy.length,
        totalProximas: resProximasDosis.length,
        totalMedicamentosVencidos: resMedVencidos.length,
        totalMedicamentosPorVencer: resMedPorVencer.length,
        totalStockBajo: resStockBajo.length,
        criticas: resDosisVencidas.length + resMedVencidos.length,
        advertencias: resProximasDosis.length + resMedPorVencer.length + resStockBajo.length,
        totalAlertas: resDosisVencidas.length + resDosisHoy.length + resProximasDosis.length + resMedVencidos.length + resMedPorVencer.length + resStockBajo.length
      }
    };
  }
}

module.exports = PrismaSanidadRepository;
