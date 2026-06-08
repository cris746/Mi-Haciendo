class UpdateVeterinario {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(id, data) {
    if (!id) throw new Error('El ID del veterinario es obligatorio');

    const vet = await this.sanidadRepository.findVeterinarioById(id);
    if (!vet) throw new Error('Veterinario no encontrado');

    const { nombre, telefono, email } = data;
    if (!nombre || !nombre.trim()) {
      throw new Error('El nombre del veterinario es obligatorio');
    }

    const trimmedNombre = nombre.trim();
    const existingName = await this.sanidadRepository.findVeterinarioByNombre(trimmedNombre);
    if (existingName && existingName.id !== parseInt(id)) {
      throw new Error('Ya existe otro veterinario con este nombre.');
    }

    let trimmedEmail = null;
    if (email && email.trim()) {
      trimmedEmail = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        throw new Error('El formato del email es inválido.');
      }
      const existingEmail = await this.sanidadRepository.findVeterinarioByEmail(trimmedEmail);
      if (existingEmail && existingEmail.id !== parseInt(id)) {
        throw new Error('Ya existe otro veterinario con este email.');
      }
    }

    return await this.sanidadRepository.updateVeterinario(id, {
      nombre:   trimmedNombre,
      telefono: telefono?.trim() || null,
      email:    trimmedEmail
    });
  }
}

module.exports = UpdateVeterinario;
