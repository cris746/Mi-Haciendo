const express = require('express');
const AnimalController = require('./AnimalController');

const router = express.Router();
const animalController = new AnimalController();

router.get('/', (req, res) => animalController.index(req, res));
router.post('/', (req, res) => animalController.store(req, res));

module.exports = router;
