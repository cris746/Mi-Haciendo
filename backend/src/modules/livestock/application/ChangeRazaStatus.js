class ChangeRazaStatus {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(id) {
    const raza = await this.animalRepository.findRazaById(id);
    if (!raza) {
      throw new Error('Raza no encontrada');
    }

    return await this.animalRepository.updateRaza(id, { estado: !raza.estado });
  }
}

module.exports = ChangeRazaStatus;
