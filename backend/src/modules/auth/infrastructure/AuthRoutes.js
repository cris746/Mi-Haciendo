const express = require('express');
const AuthController = require('./AuthController');
const authMiddleware = require('../../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../../shared/middlewares/role.middleware');

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/login', (req, res) => authController.login(req, res));

// Profile route (Protected)
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

module.exports = router;
