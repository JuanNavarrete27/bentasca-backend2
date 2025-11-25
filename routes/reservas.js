const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');

router.post('/', reservasController.crearReserva);

module.exports = router;
