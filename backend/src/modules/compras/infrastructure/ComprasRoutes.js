const express = require('express');
const ComprasController = require('./ComprasController');
const authMiddleware = require('../../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../../shared/middlewares/role.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de Proveedores (Solo Admin)
router.get('/proveedores', roleMiddleware(['ADMIN']), ComprasController.getProveedores);
router.post('/proveedores', roleMiddleware(['ADMIN']), ComprasController.createProveedor);
router.put('/proveedores/:id', roleMiddleware(['ADMIN']), ComprasController.updateProveedor);
router.patch('/proveedores/:id/estado', roleMiddleware(['ADMIN']), ComprasController.changeProveedorStatus);

// Rutas de Compras (Gestión solo por Admin)
router.post('/compras', roleMiddleware(['ADMIN']), ComprasController.createCompra);
router.get('/compras', roleMiddleware(['ADMIN']), ComprasController.getCompras);
router.get('/compras/:id', roleMiddleware(['ADMIN']), ComprasController.getCompraById);
router.patch('/compras/:id/anular', roleMiddleware(['ADMIN']), ComprasController.anularCompra);

module.exports = router;
