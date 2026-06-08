class GetAllTratamientos {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(filters = {}) {
    // Normalizar el filtro de estado si viene como string
    if (filters.estado !== undefined) {
      filters.estado = filters.estado === 'true' || filters.estado === true;
    }
    return await this.sanidadRepository.findAllTratamientos(filters);
  }
}

module.exports = GetAllTratamientos;
