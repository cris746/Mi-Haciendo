class GetMovimientosInventario {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute(filters = {}) {
    return await this.inventarioRepository.findMovimientosInventario(filters);
  }
}

module.exports = GetMovimientosInventario;
