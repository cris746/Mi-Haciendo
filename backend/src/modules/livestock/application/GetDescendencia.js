class GetDescendencia {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(id) {
    const descendencia = await this.animalRepository.findDescendencia(id);
    if (!descendencia) {
      throw new Error(`Animal con ID ${id} no encontrado`);
    }
    return descendencia;
  }
}

module.exports = GetDescendencia;
