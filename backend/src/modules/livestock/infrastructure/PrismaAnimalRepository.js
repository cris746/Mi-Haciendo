const IAnimalRepository = require('../domain/IAnimalRepository');
const prisma = require('../../../shared/infrastructure/persistence/prisma');

class PrismaAnimalRepository extends IAnimalRepository {
  async save(animalData) {
    return await prisma.animal.create({
      data: animalData,
    });
  }

  async findById(id) {
    return await prisma.animal.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return await prisma.animal.findMany({
      orderBy: { createdAt: 'desc' },
      include: { farm: true }
    });
  }

  async findByTag(tag) {
    return await prisma.animal.findUnique({
      where: { tag },
    });
  }

  async update(id, animalData) {
    return await prisma.animal.update({
      where: { id },
      data: animalData,
    });
  }

  async delete(id) {
    return await prisma.animal.delete({
      where: { id },
    });
  }
}

module.exports = PrismaAnimalRepository;
