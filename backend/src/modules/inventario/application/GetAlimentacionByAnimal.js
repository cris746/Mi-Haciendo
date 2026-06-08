class GetAlimentacionByAnimal {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute(animalId) {
    if (!animalId) {
      throw new Error('ID del animal es obligatorio');
    }
    return await this.inventarioRepository.findAlimentacionByAnimal(animalId);
  }
}

module.exports = GetAlimentacionByAnimal;
