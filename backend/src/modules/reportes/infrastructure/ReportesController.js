const GetDashboard = require('../application/GetDashboard');
const GetReporteVentas = require('../application/GetReporteVentas');
const GetReporteCompras = require('../application/GetReporteCompras');
const GetReporteInventario = require('../application/GetReporteInventario');
const GetReporteSanidad = require('../application/GetReporteSanidad');
const GetReporteAnimalesVendidos = require('../application/GetReporteAnimalesVendidos');
const GetReporteGanancias = require('../application/GetReporteGanancias');
const GetReporteStockAlertas = require('../application/GetReporteStockAlertas');
const GetReporteKardex = require('../application/GetReporteKardex');
const GetReporteClientes = require('../application/GetReporteClientes');
const GetReporteProveedores = require('../application/GetReporteProveedores');
const GetReporteAnimales = require('../application/GetReporteAnimales');
const GetReporteAlimentacion = require('../application/GetReporteAlimentacion');
const GetReporteMovimientosAnimales = require('../application/GetReporteMovimientosAnimales');
const PrismaReportesRepository = require('./PrismaReportesRepository');

const reportesRepository = new PrismaReportesRepository();

class ReportesController {
  async getDashboard(req, res) {
    try {
      const useCase = new GetDashboard(reportesRepository);
      const metrics = await useCase.execute();

      const role = req.user?.role;

      if (role === 'VETERINARIO') {
        const {
          totalVentas, totalCompras, ganancias, ventasMes, comprasMes, gananciaMes,
          cantidadVentasMes, cantidadComprasMes, ultimasVentas, ultimasCompras,
          valorInventario, valorAlimentos, valorMedicamentos,
          ...vetMetrics
        } = metrics;
        return res.json(vetMetrics);
      }

      if (role === 'VENDEDOR') {
        const {
          totalCompras, comprasMes, ganancias, gananciaMes, cantidadComprasMes, ultimasCompras,
          valorInventario, valorAlimentos, valorMedicamentos,
          totalSinStock, totalStockBajo, totalVencidos, totalPorVencer,
          alimentosSinStock, medicamentosSinStock, alimentosStockBajo, medicamentosStockBajo,
          alimentosVencidos, medicamentosVencidos, alimentosPorVencer, medicamentosPorVencer,
          tratamientosActivos, tratamientosAnulados, ultimosTratamientos,
          consumoAlimentoMes, alimentacionesMes, alimentacionesAnuladas,
          alimentoMasConsumidoNombre, alimentoMasConsumidoCantidad,
          animalMayorConsumoNombre, animalMayorConsumoCantidad, alimentacionesRecientes,
          movimientosInventarioMes, entradasInventarioMes, salidasInventarioMes, reversionesInventarioMes, movimientosInventarioRecientes,
          dosisAtrasadas, dosisHoy, dosisProximas7Dias, aplicacionesMes, medicamentosUsadosMes,
          animalMasTratadoNombre, animalMasTratadoCantidad, aplicacionesRecientes,
          dosisAtrasadasRecientes, dosisProximasRecientes, alertasSanitariasCriticas, alertasSanitariasAdvertencias,
          consumoAlimento, medicamentosUsados,
          ...sellerMetrics
        } = metrics;
        return res.json(sellerMetrics);
      }

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteVentas(req, res) {
    try {
      const { desde, hasta, clienteId, estado } = req.query;
      const useCase = new GetReporteVentas(reportesRepository);
      const data = await useCase.execute({ desde, hasta, clienteId, estado });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteCompras(req, res) {
    try {
      const { desde, hasta, proveedorId, estado } = req.query;
      const useCase = new GetReporteCompras(reportesRepository);
      const data = await useCase.execute({ desde, hasta, proveedorId, estado });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteInventario(req, res) {
    try {
      const filters = req.query;
      const useCase = new GetReporteInventario(reportesRepository);
      const data = await useCase.execute(filters);

      const role = req.user?.role;
      if (role !== 'ADMIN') {
        if (data.inventario) {
          data.inventario = data.inventario.map(item => ({
            ...item,
            precioCompra: undefined,
            valorEstimado: undefined
          }));
        }
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteSanitario(req, res) {
    try {
      const filters = req.query;
      const useCase = new GetReporteSanidad(reportesRepository);
      const data = await useCase.execute(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteAnimalesVendidos(req, res) {
    try {
      const { desde, hasta } = req.query;
      const useCase = new GetReporteAnimalesVendidos(reportesRepository);
      const data = await useCase.execute({ desde, hasta });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteGanancias(req, res) {
    try {
      const { desde, hasta } = req.query;
      const useCase = new GetReporteGanancias(reportesRepository);
      const data = await useCase.execute({ desde, hasta });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteStockBajo(req, res) {
    try {
      const filters = req.query;
      const useCase = new GetReporteStockAlertas(reportesRepository);
      const data = await useCase.execute(filters);

      const role = req.user?.role;
      if (role !== 'ADMIN') {
        if (data.alertas) {
          data.alertas = data.alertas.map(item => ({
            ...item,
            precioCompra: undefined,
            valorEstimado: undefined
          }));
        }
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteKardex(req, res) {
    try {
      const filters = req.query;
      const useCase = new GetReporteKardex(reportesRepository);
      const data = await useCase.execute(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteClientes(req, res) {
    try {
      const { estado, search } = req.query;
      const useCase = new GetReporteClientes(reportesRepository);
      const data = await useCase.execute({ estado, search });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteProveedores(req, res) {
    try {
      const { estado, search } = req.query;
      const useCase = new GetReporteProveedores(reportesRepository);
      const data = await useCase.execute({ estado, search });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteAnimales(req, res) {
    try {
      const filters = req.query;
      const useCase = new GetReporteAnimales(reportesRepository);
      const data = await useCase.execute(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteAlimentacion(req, res) {
    try {
      const filters = req.query;
      const useCase = new GetReporteAlimentacion(reportesRepository);
      const data = await useCase.execute(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReporteMovimientosAnimales(req, res) {
    try {
      const filters = req.query;
      const useCase = new GetReporteMovimientosAnimales(reportesRepository);
      const data = await useCase.execute(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ReportesController();
