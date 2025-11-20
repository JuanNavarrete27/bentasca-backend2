// routes/usuarios.js → FINAL, LIMPIO Y FUNCIONAL
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/usuariosController');
const db = require('../db');
const bcrypt = require('bcryptjs');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// RUTAS NUEVAS (SOLO ESTAS DOS)
router.get('/me', auth, (req, res) => {
  res.json(req.user); // ← tu auth.js ya carga todo (nombre, foto, etc)
});

router.put('/foto', auth, async (req, res) => {
  const { foto } = req.body;
  if (!foto || !foto.startsWith('data:image')) {
    return res.status(400).json({ error: 'Foto inválida' });
  }
  try {
    await db.query('UPDATE usuarios SET foto = ? WHERE id = ?', [foto, req.user.id]);
    req.user.foto = foto; // actualiza en memoria
    res.json({ mensaje: 'Foto actualizada', foto });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar foto' });
  }
});

// ADMIN
router.get('/', auth, soloAdmin, ctrl.listUsers);
router.get('/:id', auth, soloAdmin, ctrl.getUser);
router.put('/:id', auth, soloAdmin, ctrl.updateUser);
router.delete('/:id', auth, soloAdmin, ctrl.deleteUser);

module.exports = router;
