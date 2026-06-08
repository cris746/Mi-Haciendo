const express = require('express');
const AnimalController = require('./AnimalController');
const authMiddleware = require('../../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../../shared/middlewares/role.middleware');

const router = express.Router();
const animalController = new AnimalController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

const readRoles = roleMiddleware(['ADMIN', 'VETERINARIO', 'VENDEDOR']);
const adminOnly = roleMiddleware(['ADMIN']);

router.get('/', readRoles, animalController.index);
router.get('/razas', readRoles, animalController.getRazas);
router.post('/razas', adminOnly, animalController.storeRaza);
router.put('/razas/:id', adminOnly, animalController.updateRaza);
router.patch('/razas/:id/estado', adminOnly, animalController.changeRazaStatus);

router.get('/categorias', readRoles, animalController.getCategorias);
router.post('/categorias', adminOnly, animalController.storeCategoria);
router.put('/categorias/:id', adminOnly, animalController.updateCategoria);
router.patch('/categorias/:id/estado', adminOnly, animalController.changeCategoriaStatus);

router.post('/', adminOnly, animalController.store);
router.get('/:id', readRoles, animalController.show);
router.get('/:id/genealogy', readRoles, animalController.genealogy);
router.get('/:id/descendencia', readRoles, animalController.descendencia);
router.put('/:id', adminOnly, animalController.update);
router.patch('/:id/estado', adminOnly, animalController.changeStatus);

module.exports = router;
