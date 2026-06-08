class AddDiagnostico {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(data) {
    if (!data.tratamientoId || !data.descripcion) {
      throw new Error('ID de tratamiento y descripción son obligatorios');
    }
    return await this.sanidadRepository.addDiagnostico(data);
  }
}

module.exports = AddDiagnostico;
