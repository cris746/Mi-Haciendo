const express = require('express');
const animalRoutes = require('../modules/livestock/infrastructure/AnimalRoutes');
const authRoutes = require('../modules/auth/infrastructure/AuthRoutes');
const userRoutes = require('../modules/auth/infrastructure/UserRoutes');
const movimientoRoutes = require('../modules/movimientos/infrastructure/MovimientoRoutes');
const sanidadRoutes = require('../modules/sanidad/infrastructure/SanidadRoutes');
const inventarioRoutes = require('../modules/inventario/infrastructure/InventarioRoutes');
const ventasRoutes = require('../modules/ventas/infrastructure/VentasRoutes');
const comprasRoutes = require('../modules/compras/infrastructure/ComprasRoutes');
const reportesRoutes = require('../modules/reportes/infrastructure/ReportesRoutes');

const router = express.Router();

router.use('/animals', animalRoutes);
router.use('/auth', authRoutes);
router.use('/usuarios', userRoutes);
router.use('/movimientos', movimientoRoutes);
router.use('/', inventarioRoutes);
router.use('/', sanidadRoutes);
router.use('/', ventasRoutes);
router.use('/', comprasRoutes);
router.use('/', reportesRoutes);

module.exports = router;
