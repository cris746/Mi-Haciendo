class GetMedicamentosActivos {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute() {
    return await this.sanidadRepository.findAllMedicamentosActivos();
  }
}

module.exports = GetMedicamentosActivos;
