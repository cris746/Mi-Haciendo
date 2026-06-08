class GetAnimals {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute() {
    const animals = await this.animalRepository.findAll();
    const ahora = new Date();

    return animals.map(animal => {
      let edadActualMeses = null;
      if (animal.origen === 'NACIDO' && animal.fechaNacimiento) {
        const diffTime = Math.abs(ahora - new Date(animal.fechaNacimiento));
        edadActualMeses = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
      } else if (animal.origen === 'COMPRADO' && animal.fechaIngreso && animal.edadIngresoMeses !== null) {
        const diffTime = Math.abs(ahora - new Date(animal.fechaIngreso));
        const mesesTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
        edadActualMeses = animal.edadIngresoMeses + mesesTranscurridos;
      }
      return { ...animal, edadActualMeses };
    });
  }
}

module.exports = GetAnimals;
