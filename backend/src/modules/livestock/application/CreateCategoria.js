class CreateCategoria {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(data) {
    let { nombre, descripcion } = data;

    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre de la categoría es obligatorio');
    }

    nombre = nombre.trim();

    const existingCategoria = await this.animalRepository.findCategoriaByName(nombre);
    if (existingCategoria) {
      throw new Error(`La categoría '${nombre}' ya existe`);
    }

    const categoriaData = {
      nombre,
      descripcion: descripcion ? descripcion.trim() : null,
      estado: true
    };

    return await this.animalRepository.saveCategoria(categoriaData);
  }
}

module.exports = CreateCategoria;
