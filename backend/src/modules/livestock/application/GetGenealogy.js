class GetGenealogy {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(id) {
    const genealogy = await this.animalRepository.findGenealogy(id);
    if (!genealogy) {
      throw new Error(`Animal con ID ${id} no encontrado`);
    }
    return genealogy;
  }
}

module.exports = GetGenealogy;
