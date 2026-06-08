const CreateCliente = require('../application/CreateCliente');
const UpdateCliente = require('../application/UpdateCliente');
const ChangeClienteStatus = require('../application/ChangeClienteStatus');
const CreateVenta = require('../application/CreateVenta');
const GetVentas = require('../application/GetVentas');
const GetVentaDetalle = require('../application/GetVentaDetalle');
const PrismaVentasRepository = require('./PrismaVentasRepository');

const ventasRepository = new PrismaVentasRepository();

class VentasController {
  async createCliente(req, res) {
    try {
      const useCase = new CreateCliente(ventasRepository);
      const cliente = await useCase.execute(req.body);
      res.status(201).json(cliente);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getClientes(req, res) {
    try {
      const clientes = await ventasRepository.findAllClientes();
      res.json(clientes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCliente(req, res) {
    try {
      const { id } = req.params;
      const useCase = new UpdateCliente(ventasRepository);
      const cliente = await useCase.execute(id, req.body);
      res.json(cliente);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async changeClienteStatus(req, res) {
    try {
      const { id } = req.params;
      const useCase = new ChangeClienteStatus(ventasRepository);
      const cliente = await useCase.execute(id);
      res.json(cliente);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async createVenta(req, res) {
    try {
      const useCase = new CreateVenta(ventasRepository);
      const venta = await useCase.execute(req.body);
      res.status(201).json(venta);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getVentas(req, res) {
    try {
      const useCase = new GetVentas(ventasRepository);
      const ventas = await useCase.execute();
      res.json(ventas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getVentaById(req, res) {
    try {
      const { id } = req.params;
      const useCase = new GetVentaDetalle(ventasRepository);
      const venta = await useCase.execute(id);
      if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
      res.json(venta);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async anularVenta(req, res) {
    try {
      const { id } = req.params;
      const AnnulVentaUseCase = require('../application/AnnulVenta');
      const useCase = new AnnulVentaUseCase(ventasRepository);
      await useCase.execute(id);
      res.json({ message: 'Venta anulada con éxito y animales reactivados' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new VentasController();
