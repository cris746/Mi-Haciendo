class GetAnimalById {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(id) {
    const animal = await this.animalRepository.findById(id);
    if (!animal) {
      throw new Error(`Animal con ID ${id} no encontrado`);
    }
    let edadActualMeses = null;
    const ahora = new Date();

    if (animal.origen === 'NACIDO' && animal.fechaNacimiento) {
      const diffTime = Math.abs(ahora - new Date(animal.fechaNacimiento));
      edadActualMeses = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    } else if (animal.origen === 'COMPRADO' && animal.fechaIngreso && animal.edadIngresoMeses !== null) {
      const diffTime = Math.abs(ahora - new Date(animal.fechaIngreso));
      const mesesTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
      edadActualMeses = animal.edadIngresoMeses + mesesTranscurridos;
    }

    return {
      ...animal,
      edadActualMeses
    };
  }
}

module.exports = GetAnimalById;
