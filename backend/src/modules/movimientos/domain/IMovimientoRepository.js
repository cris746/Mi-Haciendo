/**
 * Interface for Movimiento Repository
 */
class IMovimientoRepository {
  async saveParcela(parcelaData) {
    throw new Error('Method not implemented');
  }

  async findParcelaById(id) {
    throw new Error('Method not implemented');
  }

  async findAllParcelas() {
    throw new Error('Method not implemented');
  }

  async saveMovimiento(movimientoData) {
    throw new Error('Method not implemented');
  }

  async findActiveMovimientoByAnimal(animalId) {
    throw new Error('Method not implemented');
  }

  async findHistoryByAnimal(animalId) {
    throw new Error('Method not implemented');
  }

  async transferirAnimal(animalId, nuevaParcelaId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IMovimientoRepository;
