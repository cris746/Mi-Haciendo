const IMovimientoRepository = require('../domain/IMovimientoRepository');
const prisma = require('../../../shared/infrastructure/persistence/prisma');

class PrismaMovimientoRepository extends IMovimientoRepository {
  async saveParcela(parcelaData) {
    return await prisma.parcela.create({
      data: parcelaData
    });
  }

  async findParcelaById(id) {
    return await prisma.parcela.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async findAnimalById(id) {
    return await prisma.animal.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async findAllParcelas(includeInactive = false) {
    const where = includeInactive ? {} : { estado: true };
    return await prisma.parcela.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });
  }

  async findParcelaByName(nombre) {
    return await prisma.parcela.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive'
        }
      }
    });
  }

  async updateParcela(id, data) {
    return await prisma.parcela.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async saveMovimiento(movimientoData) {
    return await prisma.movimiento.create({
      data: {
        animalId: parseInt(movimientoData.animalId),
        parcelaId: parseInt(movimientoData.parcelaId),
        fechaIngreso: movimientoData.fechaIngreso || new Date(),
        observacion: movimientoData.observacion || null
      },
      include: {
        animal: true,
        parcela: true
      }
    });
  }

  async findActiveMovimientoByAnimal(animalId) {
    return await prisma.movimiento.findFirst({
      where: {
        animalId: parseInt(animalId),
        fechaSalida: null
      }
    });
  }

  async findHistoryByAnimal(animalId) {
    return await prisma.movimiento.findMany({
      where: {
        animalId: parseInt(animalId)
      },
      include: {
        parcela: true,
        animal: {
          select: { nombre: true, nroArete: true }
        }
      },
      orderBy: {
        fechaIngreso: 'desc'
      }
    });
  }

  async transferirAnimal(animalId, nuevaParcelaId, fechaIngreso, observacion) {
    return await prisma.$transaction(async (tx) => {
      // 1. Cerrar movimiento activo si existe
      const activeMov = await tx.movimiento.findFirst({
        where: {
          animalId: parseInt(animalId),
          fechaSalida: null
        }
      });

      if (activeMov) {
        await tx.movimiento.update({
          where: { id: activeMov.id },
          data: { fechaSalida: fechaIngreso || new Date() }
        });
      }

      // 2. Crear nuevo movimiento
      return await tx.movimiento.create({
        data: {
          animalId: parseInt(animalId),
          parcelaId: parseInt(nuevaParcelaId),
          fechaIngreso: fechaIngreso || new Date(),
          observacion: observacion || null
        },
        include: {
          animal: true,
          parcela: true
        }
      });
    });
  }

  async getAnimalsWithLocation() {
    return await prisma.animal.findMany({
      where: {
        estado: true,
        vendido: false
      },
      include: {
        raza: true,
        categoria: true,
        movimientos: {
          where: { fechaSalida: null },
          include: { parcela: true },
          take: 1
        }
      },
      orderBy: { nombre: 'asc' }
    });
  }
}

module.exports = PrismaMovimientoRepository;
