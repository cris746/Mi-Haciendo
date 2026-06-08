const PrismaSanidadRepository = require('./PrismaSanidadRepository');

// Use Cases — Veterinarios
const CreateVeterinario = require('../application/CreateVeterinario');
const UpdateVeterinario = require('../application/UpdateVeterinario');
const ToggleVeterinarioEstado = require('../application/ToggleVeterinarioEstado');

// Use Cases — Tratamientos
const CreateTratamiento = require('../application/CreateTratamiento');
const GetAllTratamientos = require('../application/GetAllTratamientos');
const GetTratamientoById = require('../application/GetTratamientoById');
const GetTratamientosByAnimal = require('../application/GetTratamientosByAnimal');
const AnnulTratamiento = require('../application/AnnulTratamiento');
const FinalizarTratamiento = require('../application/FinalizarTratamiento');

// Use Cases — Diagnósticos y Aplicaciones
const AddDiagnostico = require('../application/AddDiagnostico');
const AplicarMedicamento = require('../application/AplicarMedicamento');
const GetMedicamentosActivos = require('../application/GetMedicamentosActivos');
const GetCalendarioSanitario = require('../application/GetCalendarioSanitario');
const GetSanidadAlertas = require('../application/GetSanidadAlertas');

class SanidadController {
  constructor() {
    this.repository = new PrismaSanidadRepository();

    // Veterinarios
    this.createVeterinarioUseCase = new CreateVeterinario(this.repository);
    this.updateVeterinarioUseCase = new UpdateVeterinario(this.repository);
    this.toggleVeterinarioEstadoUseCase = new ToggleVeterinarioEstado(this.repository);

    // Tratamientos
    this.createTratamientoUseCase = new CreateTratamiento(this.repository);
    this.getAllTratamientosUseCase = new GetAllTratamientos(this.repository);
    this.getTratamientoByIdUseCase = new GetTratamientoById(this.repository);
    this.getTreatmentsUseCase = new GetTratamientosByAnimal(this.repository);
    this.annulTratamientoUseCase = new AnnulTratamiento(this.repository);
    this.finalizarTratamientoUseCase = new FinalizarTratamiento(this.repository);

    // Diagnósticos / Aplicaciones / Medicamentos
    this.addDiagnosticoUseCase = new AddDiagnostico(this.repository);
    this.aplicarMedicamentoUseCase = new AplicarMedicamento(this.repository);
    this.getMedicamentosActivosUseCase = new GetMedicamentosActivos(this.repository);
    this.getCalendarioSanitarioUseCase = new GetCalendarioSanitario(this.repository);
    this.getSanidadAlertasUseCase = new GetSanidadAlertas(this.repository);

    // Bind methods
    this.getVeterinarios = this.getVeterinarios.bind(this);
    this.storeVeterinario = this.storeVeterinario.bind(this);
    this.updateVeterinario = this.updateVeterinario.bind(this);
    this.toggleVeterinario = this.toggleVeterinario.bind(this);

    this.getTratamientos = this.getTratamientos.bind(this);
    this.getTratamientoById = this.getTratamientoById.bind(this);
    this.storeTratamiento = this.storeTratamiento.bind(this);
    this.annulTratamiento = this.annulTratamiento.bind(this);
    this.finalizarTratamiento = this.finalizarTratamiento.bind(this);
    this.historyByAnimal = this.historyByAnimal.bind(this);

    this.storeDiagnostico = this.storeDiagnostico.bind(this);
    this.storeAplicacion = this.storeAplicacion.bind(this);
    this.getMedicamentosActivos = this.getMedicamentosActivos.bind(this);
    this.getCalendario = this.getCalendario.bind(this);
    this.getAlertas = this.getAlertas.bind(this);
  }

  // ── Veterinarios ────────────────────────────────────────────────────────────

  async getVeterinarios(req, res) {
    try {
      const result = await this.repository.findAllVeterinarios();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async storeVeterinario(req, res) {
    try {
      const result = await this.createVeterinarioUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateVeterinario(req, res) {
    try {
      const result = await this.updateVeterinarioUseCase.execute(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async toggleVeterinario(req, res) {
    try {
      const result = await this.toggleVeterinarioEstadoUseCase.execute(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // ── Tratamientos ─────────────────────────────────────────────────────────────

  async getTratamientos(req, res) {
    try {
      const result = await this.getAllTratamientosUseCase.execute(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTratamientoById(req, res) {
    try {
      const result = await this.getTratamientoByIdUseCase.execute(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async storeTratamiento(req, res) {
    try {
      const result = await this.createTratamientoUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async annulTratamiento(req, res) {
    try {
      const result = await this.annulTratamientoUseCase.execute(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async historyByAnimal(req, res) {
    try {
      const { animalId } = req.params;
      const history = await this.getTreatmentsUseCase.execute(animalId);
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async finalizarTratamiento(req, res) {
    try {
      const result = await this.finalizarTratamientoUseCase.execute(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // ── Diagnósticos / Aplicaciones / Medicamentos ─────────────────────────────

  async storeDiagnostico(req, res) {
    try {
      const result = await this.addDiagnosticoUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async storeAplicacion(req, res) {
    try {
      const result = await this.aplicarMedicamentoUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMedicamentosActivos(req, res) {
    try {
      const result = await this.getMedicamentosActivosUseCase.execute();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCalendario(req, res) {
    try {
      const result = await this.getCalendarioSanitarioUseCase.execute(req.query);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAlertas(req, res) {
    try {
      const result = await this.getSanidadAlertasUseCase.execute();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SanidadController;
