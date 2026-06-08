const IAnimalRepository = require('../domain/IAnimalRepository');
const prisma = require('../../../shared/infrastructure/persistence/prisma');

class PrismaAnimalRepository extends IAnimalRepository {
  async save(animalData) {
    return await prisma.animal.create({
      data: animalData,
      include: {
        raza: true,
        categoria: true
      }
    });
  }

  async findAllRazas(includeInactive = false) {
    const where = includeInactive ? {} : { estado: true };
    return await prisma.raza.findMany({ where, orderBy: { nombre: 'asc' } });
  }

  async findRazaById(id) {
    return await prisma.raza.findUnique({ where: { id: parseInt(id) } });
  }

  async findRazaByName(nombre) {
    return await prisma.raza.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive' // Requires Prisma 2.15+ on Postgres, else we do manual lower
        }
      }
    });
  }

  async saveRaza(data) {
    return await prisma.raza.create({ data });
  }

  async updateRaza(id, data) {
    return await prisma.raza.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async findAllCategorias(includeInactive = false) {
    const where = includeInactive ? {} : { estado: true };
    return await prisma.categoria.findMany({ where, orderBy: { nombre: 'asc' } });
  }

  async findCategoriaById(id) {
    return await prisma.categoria.findUnique({ where: { id: parseInt(id) } });
  }

  async findCategoriaByName(nombre) {
    return await prisma.categoria.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive'
        }
      }
    });
  }

  async saveCategoria(data) {
    return await prisma.categoria.create({ data });
  }

  async updateCategoria(id, data) {
    return await prisma.categoria.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async findById(id) {
    return await prisma.animal.findUnique({
      where: { id: parseInt(id) },
      include: {
        raza: true,
        categoria: true,
        padre: true,
        madre: true,
        hijosPadre: true,
        hijosMadre: true
      }
    });
  }

  async findAll() {
    return await prisma.animal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        raza: true,
        categoria: true
      }
    });
  }

  async findByArete(nroArete) {
    return await prisma.animal.findUnique({
      where: { nroArete },
    });
  }

  async findGenealogy(id) {
    const animal = await prisma.animal.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        nroArete: true,
        padre: {
          select: {
            id: true,
            nombre: true,
            nroArete: true,
            padre: true,
            madre: true
          }
        },
        madre: {
          select: {
            id: true,
            nombre: true,
            nroArete: true,
            padre: true,
            madre: true
          }
        }
      }
    });
    return animal;
  }

  async findDescendencia(id) {
    const animal = await prisma.animal.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        nroArete: true,
        sexo: true,
        hijosPadre: {
          include: {
            raza: true,
            categoria: true
          }
        },
        hijosMadre: {
          include: {
            raza: true,
            categoria: true
          }
        }
      }
    });
    
    if (!animal) return null;

    // Harmonize offspring list
    const hijos = animal.sexo === 'MACHO' ? animal.hijosPadre : animal.hijosMadre;
    return {
      animal: {
        id: animal.id,
        nombre: animal.nombre,
        nroArete: animal.nroArete
      },
      hijos
    };
  }

  async update(id, animalData) {
    return await prisma.animal.update({
      where: { id: parseInt(id) },
      data: animalData,
    });
  }

  async delete(id) {
    return await prisma.animal.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = PrismaAnimalRepository;
