const prisma = require('../../../shared/infrastructure/persistence/prisma');

class PrismaUserRepository {
  async save(userData) {
    return await prisma.user.create({
      data: userData,
    });
  }

  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return await prisma.user.findMany();
  }

  async update(id, userData) {
    return await prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  async delete(id) {
    return await prisma.user.delete({
      where: { id },
    });
  }
}

module.exports = PrismaUserRepository;
