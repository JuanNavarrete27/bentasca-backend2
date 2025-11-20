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

// RUTA PARA OBTENER MI PERFIL
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, email, rol, foto, created_at FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error en /me:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
