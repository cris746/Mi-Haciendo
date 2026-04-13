class CreateAnimal {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute({ tag, name, breed, gender, birthDate, weight, farmId }) {
    // Check if tag already exists
    const existingAnimal = await this.animalRepository.findByTag(tag);
    if (existingAnimal) {
       throw new Error(`Animal with tag ${tag} already exists.`);
    }

    const animal = {
      tag,
      name,
      breed,
      gender,
      birthDate: birthDate ? new Date(birthDate) : null,
      weight,
      farmId,
      status: 'Healthy',
    };

    return await this.animalRepository.save(animal);
  }
}

module.exports = CreateAnimal;
