const prisma = require('../../../shared/infrastructure/persistence/prisma');

class PrismaUserRepository {
  async save(userData) {
    return await prisma.usuario.create({
      data: userData,
    });
  }

  async findByEmail(email) {
    return await prisma.usuario.findUnique({
      where: { email },
    });
  }

  async findById(id) {
    return await prisma.usuario.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return await prisma.usuario.findMany();
  }

  async update(id, userData) {
    return await prisma.usuario.update({
      where: { id },
      data: userData,
    });
  }

  async delete(id) {
    return await prisma.usuario.delete({
      where: { id },
    });
  }
}

module.exports = PrismaUserRepository;
