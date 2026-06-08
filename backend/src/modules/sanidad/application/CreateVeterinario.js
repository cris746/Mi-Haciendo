class CreateVeterinario {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(data) {
    const { nombre, telefono, email } = data;
    if (!nombre || !nombre.trim()) {
      throw new Error('El nombre del veterinario es obligatorio');
    }
    const trimmedNombre = nombre.trim();
    const existingName = await this.sanidadRepository.findVeterinarioByNombre(trimmedNombre);
    if (existingName) {
      throw new Error('Ya existe un veterinario con este nombre.');
    }

    let trimmedEmail = null;
    if (email && email.trim()) {
      trimmedEmail = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        throw new Error('El formato del email es inválido.');
      }
      const existingEmail = await this.sanidadRepository.findVeterinarioByEmail(trimmedEmail);
      if (existingEmail) {
        throw new Error('Ya existe un veterinario con este email.');
      }
    }

    return await this.sanidadRepository.saveVeterinario({
      nombre:   trimmedNombre,
      telefono: telefono?.trim() || null,
      email:    trimmedEmail
    });
  }
}

module.exports = CreateVeterinario;
