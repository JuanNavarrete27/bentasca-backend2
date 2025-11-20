// routes/usuarios.js → VERSIÓN FINAL DEFINITIVA (SIN DUPLICADOS, SIN ERRORES)
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/usuariosController');

// AUTH PÚBLICO
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// USUARIO AUTENTICADO → USANDO TUS FUNCIONES PERFECTAS
router.get('/me', auth, ctrl.getMiPerfil);           // ← PERFECTO
router.put('/foto', auth, ctrl.actualizarFoto);      // ← PERFECTO

// ADMIN
router.get('/', auth, soloAdmin, ctrl.listUsers);
router.get('/:id', auth, soloAdmin, ctrl.getUser);
router.put('/:id', auth, soloAdmin, ctrl.updateUser);
router.delete('/:id', auth, soloAdmin, ctrl.deleteUser);

module.exports = router;
