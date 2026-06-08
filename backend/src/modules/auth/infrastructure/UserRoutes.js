const express = require('express');
const UserController = require('./UserController');
const authMiddleware = require('../../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../../shared/middlewares/role.middleware');

const router = express.Router();
const userController = new UserController();

// All user routes are protected and require ADMIN role
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

router.get('/', (req, res) => userController.getAll(req, res));
router.get('/:id', (req, res) => userController.getById(req, res));
router.post('/', (req, res) => userController.create(req, res));
router.put('/:id', (req, res) => userController.update(req, res));
router.patch('/:id/estado', (req, res) => userController.toggleStatus(req, res));

module.exports = router;
