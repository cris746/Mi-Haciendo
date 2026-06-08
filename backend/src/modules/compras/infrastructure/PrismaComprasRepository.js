const IComprasRepository = require('../domain/IComprasRepository');
const prisma = require('../../../shared/infrastructure/persistence/prisma');

class PrismaComprasRepository extends IComprasRepository {
  async saveProveedor(data) {
    return await prisma.proveedor.create({ data });
  }

  async findAllProveedores() {
    return await prisma.proveedor.findMany({
      orderBy: { nombre: 'asc' }
    });
  }

  async findProveedorById(id) {
    return await prisma.proveedor.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async updateProveedor(id, data) {
    return await prisma.proveedor.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async changeProveedorStatus(id, status) {
    return await prisma.proveedor.update({
      where: { id: parseInt(id) },
      data: { estado: status }
    });
  }

  async saveCompra(data) {
    const { proveedorId, total, detalles, numeroFactura, observacion } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Crear la compra y detalles
      const compra = await tx.compra.create({
        data: {
          numeroFactura: numeroFactura || null,
          observacion: observacion || null,
          total,
          proveedor: { connect: { id: proveedorId } },
          detalles: {
            create: detalles.map(d => ({
              cantidad: d.cantidad,
              precio: d.precio,
              subtotal: d.subtotal,
              alimentoId: d.alimentoId ? parseInt(d.alimentoId) : null,
              medicamentoId: d.medicamentoId ? parseInt(d.medicamentoId) : null
            }))
          }
        },
        include: {
          proveedor: true,
          detalles: {
            include: {
              alimento: true,
              medicamento: true
            }
          }
        }
      });

      // 2. Aumentar Stock y Registrar Movimientos
      for (const d of detalles) {
        if (d.alimentoId) {
          const alimento = await tx.alimento.findUnique({ where: { id: parseInt(d.alimentoId) } });
          const stockPrevio = alimento.stockCantidad;
          const stockPosterior = stockPrevio + parseFloat(d.cantidad);

          await tx.alimento.update({
            where: { id: parseInt(d.alimentoId) },
            data: { 
              stockCantidad: stockPosterior,
              precioCompra: parseFloat(d.precio)
            }
          });

          await tx.movimientoInventario.create({
            data: {
              tipo: 'ENTRADA',
              origen: 'COMPRA',
              itemTipo: 'ALIMENTO',
              alimentoId: alimento.id,
              cantidad: parseFloat(d.cantidad),
              unidadMedida: alimento.unidadMedida,
              stockPrevio,
              stockPosterior,
              motivo: numeroFactura ? `Compra Factura #${numeroFactura}` : "Compra de alimento",
              referenciaId: compra.id,
              referenciaTipo: "Compra"
            }
          });
        }
        if (d.medicamentoId) {
          const medicamento = await tx.medicamento.findUnique({ where: { id: parseInt(d.medicamentoId) } });
          const stockPrevio = medicamento.stockCantidad;
          const stockPosterior = stockPrevio + parseFloat(d.cantidad);

          await tx.medicamento.update({
            where: { id: parseInt(d.medicamentoId) },
            data: { 
              stockCantidad: stockPosterior,
              precioCompra: parseFloat(d.precio)
            }
          });

          await tx.movimientoInventario.create({
            data: {
              tipo: 'ENTRADA',
              origen: 'COMPRA',
              itemTipo: 'MEDICAMENTO',
              medicamentoId: medicamento.id,
              cantidad: parseFloat(d.cantidad),
              unidadMedida: medicamento.unidadMedida,
              stockPrevio,
              stockPosterior,
              motivo: numeroFactura ? `Compra Factura #${numeroFactura}` : "Compra de medicamento",
              referenciaId: compra.id,
              referenciaTipo: "Compra"
            }
          });
        }
      }

      return compra;
    });
  }

  async findAllCompras() {
    return await prisma.compra.findMany({
      include: {
        proveedor: true,
        detalles: true
      },
      orderBy: { fecha: 'desc' }
    });
  }

  async findCompraById(id) {
    return await prisma.compra.findUnique({
      where: { id: parseInt(id) },
      include: {
        proveedor: true,
        detalles: {
          include: {
            alimento: true,
            medicamento: true
          }
        }
      }
    });
  }

  async findAlimentoById(id) {
    return await prisma.alimento.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async findMedicamentoById(id) {
    return await prisma.medicamento.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async anularCompra(id, data = {}) {
    const motivoAnulacion = data.motivoAnulacion ? data.motivoAnulacion.trim() : null;

    return await prisma.$transaction(async (tx) => {
      // 1. Buscar la compra con sus detalles
      const compra = await tx.compra.findUnique({
        where: { id: parseInt(id) },
        include: { detalles: true }
      });

      if (!compra) throw new Error('Compra no encontrada');
      if (!compra.estado) throw new Error('La compra ya está anulada');

      // 2. Revertir el stock restando las cantidades compradas y registrar movimientos
      for (const d of compra.detalles) {
        if (d.alimentoId) {
          const alimento = await tx.alimento.findUnique({ where: { id: d.alimentoId } });
          if (!alimento) throw new Error(`Alimento con ID ${d.alimentoId} no encontrado durante la reversión`);
          
          const cantidadARevertir = parseFloat(d.cantidad);
          if (alimento.stockCantidad < cantidadARevertir) {
             throw new Error(`No hay stock suficiente para revertir el alimento '${alimento.nombre}'. Stock actual: ${alimento.stockCantidad}, A revertir: ${cantidadARevertir}`);
          }

          const stockPrevio = alimento.stockCantidad;
          const stockPosterior = stockPrevio - cantidadARevertir;

          await tx.alimento.update({
            where: { id: d.alimentoId },
            data: { stockCantidad: stockPosterior }
          });

          await tx.movimientoInventario.create({
            data: {
              tipo: 'REVERSION',
              origen: 'ANULACION_COMPRA',
              itemTipo: 'ALIMENTO',
              alimentoId: d.alimentoId,
              cantidad: cantidadARevertir,
              unidadMedida: alimento.unidadMedida,
              stockPrevio,
              stockPosterior,
              motivo: motivoAnulacion ? `Anulado: ${motivoAnulacion}` : "Anulación de compra",
              referenciaId: compra.id,
              referenciaTipo: "Compra"
            }
          });
        }
        
        if (d.medicamentoId) {
          const medicamento = await tx.medicamento.findUnique({ where: { id: d.medicamentoId } });
          if (!medicamento) throw new Error(`Medicamento con ID ${d.medicamentoId} no encontrado durante la reversión`);
          
          const cantidadARevertir = parseFloat(d.cantidad);
          if (medicamento.stockCantidad < cantidadARevertir) {
             throw new Error(`No hay stock suficiente para revertir el medicamento '${medicamento.nombre}'. Stock actual: ${medicamento.stockCantidad}, A revertir: ${cantidadARevertir}`);
          }

          const stockPrevio = medicamento.stockCantidad;
          const stockPosterior = stockPrevio - cantidadARevertir;

          await tx.medicamento.update({
            where: { id: d.medicamentoId },
            data: { stockCantidad: stockPosterior }
          });

          await tx.movimientoInventario.create({
            data: {
              tipo: 'REVERSION',
              origen: 'ANULACION_COMPRA',
              itemTipo: 'MEDICAMENTO',
              medicamentoId: d.medicamentoId,
              cantidad: cantidadARevertir,
              unidadMedida: medicamento.unidadMedida,
              stockPrevio,
              stockPosterior,
              motivo: motivoAnulacion ? `Anulado: ${motivoAnulacion}` : "Anulación de compra",
              referenciaId: compra.id,
              referenciaTipo: "Compra"
            }
          });
        }
      }

      // 3. Cambiar estado a false
      return await tx.compra.update({
        where: { id: parseInt(id) },
        data: { 
          estado: false,
          fechaAnulacion: new Date(),
          motivoAnulacion: motivoAnulacion
        }
      });
    });
  }
}

module.exports = PrismaComprasRepository;
