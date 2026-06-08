const express = require('express');
const MovimientoController = require('./MovimientoController');
const authMiddleware = require('../../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../../shared/middlewares/role.middleware');

const router = express.Router();
const controller = new MovimientoController();

router.use(authMiddleware);

// Solo ADMIN puede gestionar movimientos y parcelas
const allowMoves = roleMiddleware(['ADMIN']);

router.get('/parcelas', allowMoves, controller.getParcelas.bind(controller));
router.post('/parcelas', allowMoves, controller.storeParcela);
router.put('/parcelas/:id', allowMoves, controller.updateParcela);
router.patch('/parcelas/:id/estado', allowMoves, controller.changeParcelaStatus);
router.get('/animales-ubicacion', allowMoves, controller.getAnimalsWithLocation);
router.post('/movimientos', allowMoves, controller.storeMovimiento);
router.post('/movimientos/transferir', allowMoves, controller.transferir);
router.get('/movimientos/:animalId', allowMoves, controller.history);

module.exports = router;
