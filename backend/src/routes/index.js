const express = require('express');
const animalRoutes = require('../modules/livestock/infrastructure/AnimalRoutes');
const authRoutes = require('../modules/auth/infrastructure/AuthRoutes');

const router = express.Router();

router.use('/animals', animalRoutes);
router.use('/auth', authRoutes);

module.exports = router;
