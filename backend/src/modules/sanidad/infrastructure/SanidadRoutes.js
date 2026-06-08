const express = require('express');
const SanidadController = require('./SanidadController');
const authMiddleware = require('../../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../../shared/middlewares/role.middleware');

const router = express.Router();
const controller = new SanidadController();

// Todas las rutas protegidas
router.use(authMiddleware);

const healthRoles = roleMiddleware(['VETERINARIO', 'ADMIN']);
const adminRoles = roleMiddleware(['ADMIN']);

// ── Alertas Sanitarias ───────────────────────────────────────────────────────
router.get('/sanidad/alertas', healthRoles, controller.getAlertas);

// ── Calendario Sanitario ─────────────────────────────────────────────────────
router.get('/calendario', healthRoles, controller.getCalendario);

// ── Medicamentos activos (para selects) ─────────────────────────────────────
router.get('/medicamentos/activos', healthRoles, controller.getMedicamentosActivos);

// ── Veterinarios ─────────────────────────────────────────────────────────────
router.get('/veterinarios', healthRoles, controller.getVeterinarios);
router.post('/veterinarios', adminRoles, controller.storeVeterinario);
router.put('/veterinarios/:id', adminRoles, controller.updateVeterinario);
router.patch('/veterinarios/:id/estado', adminRoles, controller.toggleVeterinario);

// ── Tratamientos ─────────────────────────────────────────────────────────────
// IMPORTANTE: la ruta estática /tratamientos/animal/:animalId DEBE ir antes de /tratamientos/:id
// para que Express no interprete "animal" como un ID numérico.
router.get('/tratamientos/animal/:animalId', healthRoles, controller.historyByAnimal);
router.get('/tratamientos', healthRoles, controller.getTratamientos);
router.get('/tratamientos/:id', healthRoles, controller.getTratamientoById);
router.post('/tratamientos', healthRoles, controller.storeTratamiento);
router.patch('/tratamientos/:id/anular', healthRoles, controller.annulTratamiento);
router.patch('/tratamientos/:id/finalizar', healthRoles, controller.finalizarTratamiento);

// ── Diagnósticos ─────────────────────────────────────────────────────────────
router.post('/diagnosticos', healthRoles, controller.storeDiagnostico);

// ── Aplicaciones de Medicamento ───────────────────────────────────────────────
router.post('/aplicaciones', healthRoles, controller.storeAplicacion);

module.exports = router;
