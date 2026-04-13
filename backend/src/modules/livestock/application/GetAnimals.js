class GetAnimals {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute() {
    return await this.animalRepository.findAll();
  }
}

module.exports = GetAnimals;
