const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const reservasController = require('../controllers/reservasController');

// Crear reserva sin usuario logeado (invitado)
router.post('/crear', reservasController.crearReservaInvitado);

// Crear reserva con usuario logeado (usa req.user)
router.post('/crear-con-usuario', auth, reservasController.crearReservaConUsuario);

// Obtener todas las reservas (más adelante le podés poner soloAdmin si querés)
router.get('/', reservasController.obtenerReservas);

module.exports = router;
