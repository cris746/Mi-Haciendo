const PrismaMovimientoRepository = require('./PrismaMovimientoRepository');
const CreateParcela = require('../application/CreateParcela');
const CreateMovimiento = require('../application/CreateMovimiento');
const GetMovimientosByAnimal = require('../application/GetMovimientosByAnimal');
const TransferirAnimal = require('../application/TransferirAnimal');
const UpdateParcela = require('../application/UpdateParcela');
const ChangeParcelaStatus = require('../application/ChangeParcelaStatus');
const GetAnimalsWithLocation = require('../application/GetAnimalsWithLocation');

class MovimientoController {
  constructor() {
    this.repository = new PrismaMovimientoRepository();
    this.createParcelaUseCase = new CreateParcela(this.repository);
    this.createMovimientoUseCase = new CreateMovimiento(this.repository);
    this.getHistoryUseCase = new GetMovimientosByAnimal(this.repository);
    this.transferirUseCase = new TransferirAnimal(this.repository);
    this.updateParcelaUseCase = new UpdateParcela(this.repository);
    this.changeParcelaStatusUseCase = new ChangeParcelaStatus(this.repository);
    this.getAnimalsWithLocationUseCase = new GetAnimalsWithLocation(this.repository);

    this.storeParcela = this.storeParcela.bind(this);
    this.storeMovimiento = this.storeMovimiento.bind(this);
    this.transferir = this.transferir.bind(this);
    this.history = this.history.bind(this);
    this.updateParcela = this.updateParcela.bind(this);
    this.changeParcelaStatus = this.changeParcelaStatus.bind(this);
    this.getAnimalsWithLocation = this.getAnimalsWithLocation.bind(this);
  }

  async storeParcela(req, res) {
    try {
      const parcela = await this.createParcelaUseCase.execute(req.body);
      res.status(201).json(parcela);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getParcelas(req, res) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const parcelas = await this.repository.findAllParcelas(includeInactive);
      res.json(parcelas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateParcela(req, res) {
    try {
      const { id } = req.params;
      const parcela = await this.updateParcelaUseCase.execute(id, req.body);
      res.json(parcela);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async changeParcelaStatus(req, res) {
    try {
      const { id } = req.params;
      const parcela = await this.changeParcelaStatusUseCase.execute(id);
      res.json(parcela);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async storeMovimiento(req, res) {
    try {
      const movimiento = await this.createMovimientoUseCase.execute(req.body);
      res.status(201).json(movimiento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async transferir(req, res) {
    try {
      const movimiento = await this.transferirUseCase.execute(req.body);
      res.status(201).json(movimiento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async history(req, res) {
    try {
      const { animalId } = req.params;
      const history = await this.getHistoryUseCase.execute(animalId);
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnimalsWithLocation(req, res) {
    try {
      const animals = await this.getAnimalsWithLocationUseCase.execute();
      res.json(animals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MovimientoController;
