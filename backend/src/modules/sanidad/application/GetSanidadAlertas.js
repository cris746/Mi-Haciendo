class GetSanidadAlertas {
  constructor(repository) {
    this.repository = repository;
  }

  async execute() {
    return await this.repository.getAlertas();
  }
}

module.exports = GetSanidadAlertas;
