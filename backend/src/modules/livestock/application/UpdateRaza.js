class UpdateRaza {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(id, data) {
    const raza = await this.animalRepository.findRazaById(id);
    if (!raza) {
      throw new Error('Raza no encontrada');
    }

    const updatedData = {};

    if (data.nombre !== undefined) {
      const nombre = data.nombre.trim();
      if (nombre === '') {
        throw new Error('El nombre de la raza no puede estar vacío');
      }
      
      if (nombre.toLowerCase() !== raza.nombre.toLowerCase()) {
        const existingRaza = await this.animalRepository.findRazaByName(nombre);
        if (existingRaza && existingRaza.id !== raza.id) {
          throw new Error(`La raza '${nombre}' ya existe`);
        }
      }
      updatedData.nombre = nombre;
    }

    if (data.descripcion !== undefined) {
      updatedData.descripcion = data.descripcion ? data.descripcion.trim() : null;
    }

    return await this.animalRepository.updateRaza(id, updatedData);
  }
}

module.exports = UpdateRaza;
