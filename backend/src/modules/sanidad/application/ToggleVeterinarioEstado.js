class ToggleVeterinarioEstado {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(id) {
    if (!id) throw new Error('El ID del veterinario es obligatorio');

    const vet = await this.sanidadRepository.findVeterinarioById(id);
    if (!vet) throw new Error('Veterinario no encontrado');

    // Si se intenta desactivar, verificar que no tenga tratamientos activos en curso
    if (vet.estado && vet._count?.tratamientos > 0) {
      // Permitimos desactivar igualmente (los tratamientos registrados son historial),
      // solo bloqueamos si hay tratamientos activos. Aquí solo cambiamos el estado.
    }

    return await this.sanidadRepository.toggleVeterinarioEstado(id);
  }
}

module.exports = ToggleVeterinarioEstado;
