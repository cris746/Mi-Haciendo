const CreateAlimento = require('../application/CreateAlimento');
const GetAlimentos = require('../application/GetAlimentos');
const UpdateAlimento = require('../application/UpdateAlimento');
const ChangeAlimentoStatus = require('../application/ChangeAlimentoStatus');
const RegistrarAlimentacion = require('../application/RegistrarAlimentacion');
const AnnulAlimentacion = require('../application/AnnulAlimentacion');
const GetAlimentacionByAnimal = require('../application/GetAlimentacionByAnimal');
const GetMovimientosInventario = require('../application/GetMovimientosInventario');
const CreateMedicamento = require('../application/CreateMedicamento');
const UpdateMedicamento = require('../application/UpdateMedicamento');
const ChangeMedicamentoStatus = require('../application/ChangeMedicamentoStatus');
const GetInventarioResumen = require('../application/GetInventarioResumen');
const PrismaInventarioRepository = require('./PrismaInventarioRepository');

const inventarioRepository = new PrismaInventarioRepository();

class InventarioController {
  async createAlimento(req, res) {
    try {
      const useCase = new CreateAlimento(inventarioRepository);
      const alimento = await useCase.execute(req.body);
      res.status(201).json(alimento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateAlimento(req, res) {
    try {
      const { id } = req.params;
      const useCase = new UpdateAlimento(inventarioRepository);
      const alimento = await useCase.execute(id, req.body);
      res.json(alimento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async changeAlimentoStatus(req, res) {
    try {
      const { id } = req.params;
      const useCase = new ChangeAlimentoStatus(inventarioRepository);
      await useCase.execute(id);
      res.json({ message: 'Estado del alimento actualizado' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMedicamentos(req, res) {
    try {
      const medicamentos = await inventarioRepository.findAllMedicamentos();
      res.json(medicamentos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createMedicamento(req, res) {
    try {
      const useCase = new CreateMedicamento(inventarioRepository);
      const medicamento = await useCase.execute(req.body);
      res.status(201).json(medicamento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateMedicamento(req, res) {
    try {
      const { id } = req.params;
      const useCase = new UpdateMedicamento(inventarioRepository);
      const medicamento = await useCase.execute(id, req.body);
      res.json(medicamento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async changeMedicamentoStatus(req, res) {
    try {
      const { id } = req.params;
      const useCase = new ChangeMedicamentoStatus(inventarioRepository);
      await useCase.execute(id);
      res.json({ message: 'Estado del medicamento actualizado' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAlimentos(req, res) {
    try {
      const useCase = new GetAlimentos(inventarioRepository);
      const alimentos = await useCase.execute();
      res.json(alimentos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async registrarAlimentacion(req, res) {
    try {
      const useCase = new RegistrarAlimentacion(inventarioRepository);
      const alimentacion = await useCase.execute(req.body);
      res.status(201).json(alimentacion);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAlimentacionByAnimal(req, res) {
    try {
      const { animalId } = req.params;
      const useCase = new GetAlimentacionByAnimal(inventarioRepository);
      const history = await useCase.execute(animalId);
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async annulAlimentacion(req, res) {
    try {
      const { id } = req.params;
      const { motivoAnulacion } = req.body;
      const useCase = new AnnulAlimentacion(inventarioRepository);
      const result = await useCase.execute(id, motivoAnulacion);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMovimientosInventario(req, res) {
    try {
      const useCase = new GetMovimientosInventario(inventarioRepository);
      const movimientos = await useCase.execute(req.query);
      res.json(movimientos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getResumen(req, res) {
    try {
      const useCase = new GetInventarioResumen(inventarioRepository);
      const resumen = await useCase.execute();
      res.json(resumen);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new InventarioController();
