class GetInventarioResumen {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute() {
    return await this.inventarioRepository.getResumen();
  }
}

module.exports = GetInventarioResumen;
