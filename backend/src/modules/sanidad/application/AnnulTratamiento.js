class AnnulTratamiento {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(id) {
    if (!id) throw new Error('El ID del tratamiento es obligatorio');

    const tratamiento = await this.sanidadRepository.findTratamientoById(id);
    if (!tratamiento)       throw new Error('Tratamiento no encontrado');
    if (!tratamiento.estado) throw new Error('El tratamiento ya está anulado');

    return await this.sanidadRepository.annulTratamiento(id);
  }
}

module.exports = AnnulTratamiento;
