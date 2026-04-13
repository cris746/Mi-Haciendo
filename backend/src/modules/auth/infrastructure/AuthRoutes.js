const express = require('express');
const AuthController = require('./AuthController');
const authMiddleware = require('./middlewares/auth.middleware');
const roleMiddleware = require('./middlewares/role.middleware');

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/login', (req, res) => authController.login(req, res));

// Restricted routes (Only ADMIN can register new users)
router.post('/register', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => authController.register(req, res));

// Profile route
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

module.exports = router;
