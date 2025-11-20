// routes/usuarios.js → VERSIÓN FINAL, LIMPIA Y 100% FUNCIONAL
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/usuariosController');
const db = require('../db');
const bcrypt = require('bcryptjs');

// -------------------------
// AUTH PÚBLICO
// -------------------------
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// -------------------------
// USUARIO AUTENTICADO
// -------------------------

// Obtener mi perfil SIEMPRE desde la DB
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, email, rol, foto FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const u = rows[0];

    res.json({
      id: u.id,
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      email: u.email,
      rol: u.rol,
      foto: u.foto || null
    });
  } catch (err) {
    console.error('Error en /usuarios/me:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Cambiar contraseña
router.put('/change-password', auth, async (req, res) => {
  const { actual, nueva } = req.body;
  if (!actual || !nueva) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const [rows] = await db.query('SELECT password FROM usuarios WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const passwordValido = bcrypt.compareSync(actual, rows[0].password);
    if (!passwordValido) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const hash = bcrypt.hashSync(nueva, 10);
    await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, req.user.id]);

    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
    console.error('Error en change-password:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Subir foto de perfil (base64 desde frontend)
router.put('/foto', auth, async (req, res) => {
  const { foto } = req.body;

  if (!foto) {
    return res.status(400).json({ error: 'Falta la foto' });
  }

  // Si viene en formato data URL, validamos un poco el tamaño
  if (foto.startsWith('data:image')) {
    const base64Data = foto.split(',')[1] || '';
    // límite algo más alto (≈3.5 MB)
    if (base64Data.length > 5_000_000) {
      return res.status(400).json({ error: 'Imagen demasiado grande (máx ~3.5MB)' });
    }
  }

  try {
    await db.query('UPDATE usuarios SET foto = ? WHERE id = ?', [foto, req.user.id]);
    return res.json({ mensaje: 'Foto actualizada', foto });
  } catch (err) {
    console.error('Error guardando foto:', err);
    return res.status(500).json({ error: 'Error al guardar foto' });
  }
});
// -------------------------
// ADMIN
// -------------------------
router.get('/', auth, soloAdmin, ctrl.listUsers);
router.get('/:id', auth, soloAdmin, ctrl.getUser);
router.put('/:id', auth, soloAdmin, ctrl.updateUser);
router.delete('/:id', auth, soloAdmin, ctrl.deleteUser);

module.exports = router;
