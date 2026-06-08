const express = require('express');
const ReportesController = require('./ReportesController');
const authMiddleware = require('../../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../../shared/middlewares/role.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ── Dashboard ── 
router.get('/dashboard', roleMiddleware(['ADMIN', 'VETERINARIO', 'VENDEDOR']), ReportesController.getDashboard);

// ── Reportes con filtros ── ADMIN (VENDEDOR puede ver ventas)
router.get('/reportes/ventas',           roleMiddleware(['ADMIN', 'VENDEDOR']), ReportesController.getReporteVentas);
router.get('/reportes/compras',          roleMiddleware(['ADMIN']),             ReportesController.getReporteCompras);
router.get('/reportes/inventario',       roleMiddleware(['ADMIN', 'VETERINARIO']), ReportesController.getReporteInventario);
router.get('/reportes/kardex',           roleMiddleware(['ADMIN']),             ReportesController.getReporteKardex);
router.get('/reportes/sanitario',        roleMiddleware(['ADMIN', 'VETERINARIO']), ReportesController.getReporteSanitario);
router.get('/reportes/animales-vendidos', roleMiddleware(['ADMIN']),            ReportesController.getReporteAnimalesVendidos);
router.get('/reportes/ganancias',        roleMiddleware(['ADMIN']),             ReportesController.getReporteGanancias);
router.get('/reportes/stock-bajo',       roleMiddleware(['ADMIN', 'VETERINARIO']), ReportesController.getReporteStockBajo);
router.get('/reportes/clientes',         roleMiddleware(['ADMIN', 'VENDEDOR']), ReportesController.getReporteClientes);
router.get('/reportes/proveedores',      roleMiddleware(['ADMIN']),             ReportesController.getReporteProveedores);
router.get('/reportes/animales',         roleMiddleware(['ADMIN', 'VETERINARIO', 'VENDEDOR']), ReportesController.getReporteAnimales);
router.get('/reportes/alimentacion',     roleMiddleware(['ADMIN', 'VETERINARIO']),             ReportesController.getReporteAlimentacion);
router.get('/reportes/movimientos-animales', roleMiddleware(['ADMIN', 'VETERINARIO']),         ReportesController.getReporteMovimientosAnimales);

module.exports = router;
