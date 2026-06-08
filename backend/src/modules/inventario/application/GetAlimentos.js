class GetAlimentos {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute() {
    return await this.inventarioRepository.findAllAlimentos();
  }
}

module.exports = GetAlimentos;
