class UpdateCategoria {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(id, data) {
    const categoria = await this.animalRepository.findCategoriaById(id);
    if (!categoria) {
      throw new Error('Categoría no encontrada');
    }

    const updatedData = {};

    if (data.nombre !== undefined) {
      const nombre = data.nombre.trim();
      if (nombre === '') {
        throw new Error('El nombre de la categoría no puede estar vacío');
      }
      
      if (nombre.toLowerCase() !== categoria.nombre.toLowerCase()) {
        const existingCategoria = await this.animalRepository.findCategoriaByName(nombre);
        if (existingCategoria && existingCategoria.id !== categoria.id) {
          throw new Error(`La categoría '${nombre}' ya existe`);
        }
      }
      updatedData.nombre = nombre;
    }

    if (data.descripcion !== undefined) {
      updatedData.descripcion = data.descripcion ? data.descripcion.trim() : null;
    }

    return await this.animalRepository.updateCategoria(id, updatedData);
  }
}

module.exports = UpdateCategoria;
