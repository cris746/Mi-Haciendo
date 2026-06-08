class GetVentas {
  constructor(ventasRepository) {
    this.ventasRepository = ventasRepository;
  }

  async execute() {
    return await this.ventasRepository.findAllVentas();
  }
}

module.exports = GetVentas;
