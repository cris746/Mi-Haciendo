const IVentasRepository = require('../domain/IVentasRepository');
const prisma = require('../../../shared/infrastructure/persistence/prisma');

class PrismaVentasRepository extends IVentasRepository {
  async saveCliente(data) {
    return await prisma.cliente.create({ data });
  }

  async findAllClientes() {
    return await prisma.cliente.findMany({
      orderBy: { nombre: 'asc' }
    });
  }

  async findClienteById(id) {
    return await prisma.cliente.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async updateCliente(id, data) {
    return await prisma.cliente.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async changeClienteStatus(id, status) {
    return await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: { estado: status }
    });
  }

  async saveVenta(data) {
    const { clienteId, total, detalles, numeroFactura, observacion } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Validar que los animales no hayan sido vendidos
      const animalIds = detalles
        .filter(d => d.animalId)
        .map(d => parseInt(d.animalId));

      if (animalIds.length > 0) {
        const animales = await tx.animal.findMany({
          where: { id: { in: animalIds } }
        });

        for (const animal of animales) {
          if (animal.vendido) {
            throw new Error(`El animal con arete ${animal.nroArete} ya ha sido vendido.`);
          }
        }

        // 2. Marcar animales como vendidos y actualizar su peso
        for (const detalle of detalles) {
          if (detalle.animalId) {
            await tx.animal.update({
              where: { id: parseInt(detalle.animalId) },
              data: { 
                vendido: true, 
                estado: false, // También los desactivamos del inventario activo
                peso: detalle.pesoVenta ? parseFloat(detalle.pesoVenta) : undefined
              }
            });
          }
        }
      }

      // 3. Crear la venta y sus detalles
      return await tx.venta.create({
        data: {
          total,
          numeroFactura: numeroFactura || null,
          observacion: observacion || null,
          cliente: { connect: { id: clienteId } },
          detalles: {
            create: detalles.map(d => ({
              cantidad: d.cantidad,
              precio: d.precio,
              subtotal: d.subtotal,
              pesoVenta: d.pesoVenta || null,
              precioKg: d.precioKg || null,
              precioCompraAnimal: d.precioCompraAnimal !== undefined ? d.precioCompraAnimal : null,
              gananciaAnimal: d.gananciaAnimal !== undefined ? d.gananciaAnimal : null,
              animalId: d.animalId ? parseInt(d.animalId) : null
            }))
          }
        },
        include: {
          cliente: true,
          detalles: {
            include: {
              animal: {
                select: { nombre: true, nroArete: true }
              }
            }
          }
        }
      });
    });
  }

  async findAllVentas() {
    return await prisma.venta.findMany({
      include: {
        cliente: true,
        detalles: {
          include: {
            animal: {
              select: {
                id: true,
                nombre: true,
                nroArete: true,
                peso: true
              }
            }
          }
        }
      },
      orderBy: { fecha: 'desc' }
    });
  }

  async findVentaById(id) {
    return await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        detalles: {
          include: {
            animal: {
              select: { nombre: true, nroArete: true }
            }
          }
        }
      }
    });
  }

  async findAnimalById(id) {
    return await prisma.animal.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async anularVenta(id, motivoAnulacion) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar la venta con sus detalles
      const venta = await tx.venta.findUnique({
        where: { id: parseInt(id) },
        include: { detalles: true }
      });

      if (!venta) throw new Error('Venta no encontrada');
      if (!venta.estado) throw new Error('La venta ya se encuentra anulada.');
      if (!venta.detalles || venta.detalles.length === 0) throw new Error('La venta no tiene detalles');

      // 2. Revertir cada animal vendido
      const animalIds = venta.detalles
        .filter(d => d.animalId)
        .map(d => parseInt(d.animalId));

      if (animalIds.length > 0) {
        await tx.animal.updateMany({
          where: { id: { in: animalIds } },
          data: { vendido: false, estado: true } // Reactivamos el animal y le quitamos el 'vendido'
        });
      }

      // 3. Cambiar estado a false y registrar auditoría
      return await tx.venta.update({
        where: { id: parseInt(id) },
        data: { 
          estado: false,
          fechaAnulacion: new Date(),
          motivoAnulacion: motivoAnulacion ? motivoAnulacion.trim() : null
        }
      });
    });
  }
}

module.exports = PrismaVentasRepository;
