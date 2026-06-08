class GetTratamientoById {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(id) {
    if (!id) throw new Error('El ID del tratamiento es obligatorio');
    const tratamiento = await this.sanidadRepository.findTratamientoById(id);
    if (!tratamiento) throw new Error('Tratamiento no encontrado');
    return tratamiento;
  }
}

module.exports = GetTratamientoById;
