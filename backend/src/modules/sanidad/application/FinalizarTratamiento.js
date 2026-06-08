class FinalizarTratamiento {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(id) {
    if (!id) throw new Error('El ID del tratamiento es obligatorio');

    const tratamiento = await this.sanidadRepository.findTratamientoById(id);
    if (!tratamiento) throw new Error('Tratamiento no encontrado');
    if (!tratamiento.estado) throw new Error('No se puede finalizar un tratamiento anulado.');
    if (tratamiento.fechaFin) throw new Error('El tratamiento ya fue finalizado.');

    return await this.sanidadRepository.finalizarTratamiento(id);
  }
}

module.exports = FinalizarTratamiento;
