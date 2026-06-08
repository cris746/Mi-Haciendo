class ChangeAnimalStatus {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(id) {
    const animal = await this.animalRepository.findById(id);
    if (!animal) {
      throw new Error('Animal no encontrado');
    }

    // Toggle estado
    const newStatus = !animal.estado;

    return await this.animalRepository.update(id, { estado: newStatus });
  }
}

module.exports = ChangeAnimalStatus;
