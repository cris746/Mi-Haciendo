class GetTratamientosByAnimal {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(animalId) {
    if (!animalId) throw new Error('El ID del animal es obligatorio');
    return await this.sanidadRepository.findTratamientosByAnimal(animalId);
  }
}

module.exports = GetTratamientosByAnimal;
