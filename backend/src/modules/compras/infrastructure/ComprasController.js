const CreateProveedor = require('../application/CreateProveedor');
const UpdateProveedor = require('../application/UpdateProveedor');
const ChangeProveedorStatus = require('../application/ChangeProveedorStatus');
const CreateCompra = require('../application/CreateCompra');
const GetCompras = require('../application/GetCompras');
const GetCompraDetalle = require('../application/GetCompraDetalle');
const PrismaComprasRepository = require('./PrismaComprasRepository');

const comprasRepository = new PrismaComprasRepository();

class ComprasController {
  async createProveedor(req, res) {
    try {
      const useCase = new CreateProveedor(comprasRepository);
      const proveedor = await useCase.execute(req.body);
      res.status(201).json(proveedor);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProveedores(req, res) {
    try {
      const proveedores = await comprasRepository.findAllProveedores();
      res.json(proveedores);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProveedor(req, res) {
    try {
      const { id } = req.params;
      const useCase = new UpdateProveedor(comprasRepository);
      const proveedor = await useCase.execute(id, req.body);
      res.json(proveedor);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async changeProveedorStatus(req, res) {
    try {
      const { id } = req.params;
      const useCase = new ChangeProveedorStatus(comprasRepository);
      const proveedor = await useCase.execute(id);
      res.json(proveedor);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async createCompra(req, res) {
    try {
      const useCase = new CreateCompra(comprasRepository);
      const compra = await useCase.execute(req.body);
      res.status(201).json(compra);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCompras(req, res) {
    try {
      const useCase = new GetCompras(comprasRepository);
      const compras = await useCase.execute();
      res.json(compras);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCompraById(req, res) {
    try {
      const { id } = req.params;
      const useCase = new GetCompraDetalle(comprasRepository);
      const compra = await useCase.execute(id);
      if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });
      res.json(compra);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async anularCompra(req, res) {
    try {
      const { id } = req.params;
      const AnnulCompraUseCase = require('../application/AnnulCompra');
      const useCase = new AnnulCompraUseCase(comprasRepository);
      await useCase.execute(id, req.body);
      res.json({ message: 'Compra anulada con éxito y stock revertido' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ComprasController();
