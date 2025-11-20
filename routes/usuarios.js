 
// routes/usuarios.js → VERSIÓN FINAL
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/usuariosController');
const db = require('../db');
const bcrypt = require('bcryptjs');
// -------------------------
// AUTH
// -------------------------
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
// -------------------------
// PERFIL DEL USUARIO
// -------------------------
router.get('/me', auth, (req, res) => {
  res.json({
    id: req.user.id,
    nombre: req.user.nombre || '',
    apellido: req.user.apellido || '',
    email: req.user.email,
    rol: req.user.rol
  });
});
// -------------------------
// CAMBIAR PASSWORD
// -------------------------
router.put('/change-password', auth, async (req, res) => {
  const { actual, nueva } = req.body;
  if (!actual || !nueva) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const [rows] = await db.query(
      'SELECT password FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const passwordValido = bcrypt.compareSync(actual, rows[0].password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    const hash = bcrypt.hashSync(nueva, 10);
    await db.query(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hash, req.user.id]
    );
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
    console.error('Error change-password:', err);
    res.status(500).json({ error: 'Error en servidor' });
  }
});
// -------------------------
// SUBIR FOTO BASE64
// -------------------------
router.put('/foto', auth, async (req, res) => {
  const { foto } = req.body;
  if (!foto || !foto.startsWith('data:image')) {
    return res.status(400).json({ error: 'Formato de imagen inválido' });
  }
  try {
    await db.query(
      'UPDATE usuarios SET foto = ? WHERE id = ?',
      [foto, req.user.id]
    );
    res.json({ mensaje: 'Foto actualizada', foto });
  } catch (err) {
    console.error('Error al guardar foto:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});
// -------------------------
// ADMIN
// -------------------------
router.get('/', auth, soloAdmin, ctrl.listUsers);
router.get('/:id', auth, soloAdmin, ctrl.getUser);
router.put('/:id', auth, soloAdmin, ctrl.updateUser);
router.delete('/:id', auth, soloAdmin, ctrl.deleteUser);
// RUTA PERFIL (get /usuarios/me)
router.get('/me', auth, (req, res) => {
  const { id, email, rol, nombre, apellido } = req.user;
  res.json({
    id,
    nombre,
    apellido,
    email,
    rol
  });
});
// RUTA CAMBIAR PASSWORD (put /usuarios/change-password)
router.put('/change-password', auth, async (req, res) => {
  const { actual, nueva } = req.body;
  if (!actual || !nueva) return res.status(400).json({ error: 'Faltan datos' });
  try {
    const [rows] = await db.query('SELECT password FROM usuarios WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const passwordValido = bcrypt.compareSync(actual, rows[0].password);
    if (!passwordValido) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    const hash = bcrypt.hashSync(nueva, 10);
    await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});


// Ruta para obtener mi perfil (necesaria para el header y perfil)
router.get('/me', auth, ctrl.getMiPerfil);

// Ruta para actualizar foto (base64)
router.put('/foto', auth, async (req, res) => {
  const { foto } = req.body;
  if (!foto || !foto.startsWith('data:image')) {
    return res.status(400).json({ error: 'Foto inválida' });
  }
  try {
    await require('../db').query(
      'UPDATE usuarios SET foto = ? WHERE id = ?',
      [foto, req.user.id]
    );
    res.json({ mensaje: 'Foto actualizada', foto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar foto' });
  }
});
module.exports = router;
