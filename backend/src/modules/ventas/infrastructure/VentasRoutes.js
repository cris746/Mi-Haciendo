const express = require('express');
const VentasController = require('./VentasController');
const authMiddleware = require('../../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../../shared/middlewares/role.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

const salesRoles = roleMiddleware(['VENDEDOR', 'ADMIN']);
const adminOnly = roleMiddleware(['ADMIN']);

// Clientes
router.get('/clientes', salesRoles, VentasController.getClientes);
router.post('/clientes', salesRoles, VentasController.createCliente);
router.put('/clientes/:id', salesRoles, VentasController.updateCliente);
router.patch('/clientes/:id/estado', salesRoles, VentasController.changeClienteStatus);

// Ventas
router.post('/ventas', salesRoles, VentasController.createVenta);
router.get('/ventas', salesRoles, VentasController.getVentas);
router.get('/ventas/:id', salesRoles, VentasController.getVentaById);
router.patch('/ventas/:id/anular', adminOnly, VentasController.anularVenta);

module.exports = router;
