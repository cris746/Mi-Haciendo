const express = require('express');
const InventarioController = require('./InventarioController');
const authMiddleware = require('../../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../../shared/middlewares/role.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Permisos mixtos
const adminOnly = roleMiddleware(['ADMIN']);
const vetOrAdmin = roleMiddleware(['ADMIN', 'VETERINARIO']);

// Alimentos
router.get('/alimentos', vetOrAdmin, InventarioController.getAlimentos);
router.post('/alimentos', adminOnly, InventarioController.createAlimento);
router.put('/alimentos/:id', adminOnly, InventarioController.updateAlimento);
router.patch('/alimentos/:id/estado', adminOnly, InventarioController.changeAlimentoStatus);

// Medicamentos
router.get('/medicamentos', vetOrAdmin, InventarioController.getMedicamentos);
router.post('/medicamentos', adminOnly, InventarioController.createMedicamento);
router.put('/medicamentos/:id', adminOnly, InventarioController.updateMedicamento);
router.patch('/medicamentos/:id/estado', adminOnly, InventarioController.changeMedicamentoStatus);

// Alimentación
router.post('/alimentacion', vetOrAdmin, InventarioController.registrarAlimentacion);
router.get('/alimentacion/animal/:animalId', vetOrAdmin, InventarioController.getAlimentacionByAnimal);
router.patch('/alimentacion/:id/anular', vetOrAdmin, InventarioController.annulAlimentacion);

// Historial (Kardex)
router.get('/inventario/movimientos', vetOrAdmin, InventarioController.getMovimientosInventario);

// Resumen y Alertas
router.get('/inventario/resumen', vetOrAdmin, InventarioController.getResumen);

module.exports = router;
