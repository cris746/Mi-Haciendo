const GetAnimals = require('../application/GetAnimals');
const CreateAnimal = require('../application/CreateAnimal');
const PrismaAnimalRepository = require('./PrismaAnimalRepository');

class AnimalController {
  constructor() {
    this.animalRepository = new PrismaAnimalRepository();
    this.getAnimalsUseCase = new GetAnimals(this.animalRepository);
    this.createAnimalUseCase = new CreateAnimal(this.animalRepository);
  }

  async index(req, res) {
    try {
      const animals = await this.getAnimalsUseCase.execute();
      res.json(animals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async store(req, res) {
    try {
      const animal = await this.createAnimalUseCase.execute(req.body);
      res.status(201).json(animal);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = AnimalController;
