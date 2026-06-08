class IInventarioRepository {
  async saveAlimento(data) {
    throw new Error('Method not implemented');
  }

  async findAllAlimentos() {
    throw new Error('Method not implemented');
  }

  async findAlimentoById(id) {
    throw new Error('Method not implemented');
  }

  async updateAlimento(id, data) {
    throw new Error('Method not implemented');
  }

  async changeAlimentoStatus(id, status) {
    throw new Error('Method not implemented');
  }

  async saveMedicamento(data) {
    throw new Error('Method not implemented');
  }

  async findAllMedicamentos() {
    throw new Error('Method not implemented');
  }

  async findMedicamentoById(id) {
    throw new Error('Method not implemented');
  }

  async updateMedicamento(id, data) {
    throw new Error('Method not implemented');
  }

  async changeMedicamentoStatus(id, status) {
    throw new Error('Method not implemented');
  }

  async registrarAlimentacion(data) {
    throw new Error('Method not implemented');
  }

  async findAlimentacionByAnimal(animalId) {
    throw new Error('Method not implemented');
  }

  async getResumen() {
    throw new Error('Method not implemented');
  }
}

module.exports = IInventarioRepository;
