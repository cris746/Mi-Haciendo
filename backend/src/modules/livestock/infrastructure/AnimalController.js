const GetAnimals = require('../application/GetAnimals');
const CreateAnimal = require('../application/CreateAnimal');
const GetAnimalById = require('../application/GetAnimalById');
const GetGenealogy = require('../application/GetGenealogy');
const GetDescendencia = require('../application/GetDescendencia');
const UpdateAnimal = require('../application/UpdateAnimal');
const ChangeAnimalStatus = require('../application/ChangeAnimalStatus');
const CreateRaza = require('../application/CreateRaza');
const UpdateRaza = require('../application/UpdateRaza');
const ChangeRazaStatus = require('../application/ChangeRazaStatus');
const CreateCategoria = require('../application/CreateCategoria');
const UpdateCategoria = require('../application/UpdateCategoria');
const ChangeCategoriaStatus = require('../application/ChangeCategoriaStatus');
const PrismaAnimalRepository = require('./PrismaAnimalRepository');

class AnimalController {
  constructor() {
    this.animalRepository = new PrismaAnimalRepository();
    this.getAnimalsUseCase = new GetAnimals(this.animalRepository);
    this.createAnimalUseCase = new CreateAnimal(this.animalRepository);
    this.getAnimalByIdUseCase = new GetAnimalById(this.animalRepository);
    this.getGenealogyUseCase = new GetGenealogy(this.animalRepository);
    this.getDescendenciaUseCase = new GetDescendencia(this.animalRepository);
    this.updateAnimalUseCase = new UpdateAnimal(this.animalRepository);
    this.changeStatusUseCase = new ChangeAnimalStatus(this.animalRepository);
    this.createRazaUseCase = new CreateRaza(this.animalRepository);
    this.updateRazaUseCase = new UpdateRaza(this.animalRepository);
    this.changeRazaStatusUseCase = new ChangeRazaStatus(this.animalRepository);
    this.createCategoriaUseCase = new CreateCategoria(this.animalRepository);
    this.updateCategoriaUseCase = new UpdateCategoria(this.animalRepository);
    this.changeCategoriaStatusUseCase = new ChangeCategoriaStatus(this.animalRepository);
    
    // Bind methods
    this.index = this.index.bind(this);
    this.store = this.store.bind(this);
    this.show = this.show.bind(this);
    this.genealogy = this.genealogy.bind(this);
    this.descendencia = this.descendencia.bind(this);
    this.update = this.update.bind(this);
    this.changeStatus = this.changeStatus.bind(this);
    
    // Catalogos bindings
    this.getRazas = this.getRazas.bind(this);
    this.storeRaza = this.storeRaza.bind(this);
    this.updateRaza = this.updateRaza.bind(this);
    this.changeRazaStatus = this.changeRazaStatus.bind(this);
    this.getCategorias = this.getCategorias.bind(this);
    this.storeCategoria = this.storeCategoria.bind(this);
    this.updateCategoria = this.updateCategoria.bind(this);
    this.changeCategoriaStatus = this.changeCategoriaStatus.bind(this);
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

  async show(req, res) {
    try {
      const { id } = req.params;
      const animal = await this.getAnimalByIdUseCase.execute(id);
      res.json(animal);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async genealogy(req, res) {
    try {
      const { id } = req.params;
      const genealogy = await this.getGenealogyUseCase.execute(id);
      res.json(genealogy);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async descendencia(req, res) {
    try {
      const { id } = req.params;
      const descendencia = await this.getDescendenciaUseCase.execute(id);
      res.json(descendencia);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getRazas(req, res) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const razas = await this.animalRepository.findAllRazas(includeInactive);
      res.json(razas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async storeRaza(req, res) {
    try {
      const raza = await this.createRazaUseCase.execute(req.body);
      res.status(201).json(raza);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateRaza(req, res) {
    try {
      const { id } = req.params;
      const raza = await this.updateRazaUseCase.execute(id, req.body);
      res.json(raza);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async changeRazaStatus(req, res) {
    try {
      const { id } = req.params;
      const raza = await this.changeRazaStatusUseCase.execute(id);
      res.json(raza);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCategorias(req, res) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categorias = await this.animalRepository.findAllCategorias(includeInactive);
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async storeCategoria(req, res) {
    try {
      const categoria = await this.createCategoriaUseCase.execute(req.body);
      res.status(201).json(categoria);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateCategoria(req, res) {
    try {
      const { id } = req.params;
      const categoria = await this.updateCategoriaUseCase.execute(id, req.body);
      res.json(categoria);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async changeCategoriaStatus(req, res) {
    try {
      const { id } = req.params;
      const categoria = await this.changeCategoriaStatusUseCase.execute(id);
      res.json(categoria);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const animal = await this.updateAnimalUseCase.execute(id, req.body);
      res.json(animal);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const animal = await this.changeStatusUseCase.execute(id);
      res.json(animal);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = AnimalController;
