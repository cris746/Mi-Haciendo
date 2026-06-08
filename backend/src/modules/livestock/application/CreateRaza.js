class CreateRaza {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(data) {
    let { nombre, descripcion } = data;

    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre de la raza es obligatorio');
    }

    nombre = nombre.trim();

    const existingRaza = await this.animalRepository.findRazaByName(nombre);
    if (existingRaza) {
      throw new Error(`La raza '${nombre}' ya existe`);
    }

    const razaData = {
      nombre,
      descripcion: descripcion ? descripcion.trim() : null,
      estado: true
    };

    return await this.animalRepository.saveRaza(razaData);
  }
}

module.exports = CreateRaza;
