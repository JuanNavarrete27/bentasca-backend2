// routes/usuarios.js → VERSIÓN FINAL CORRECTA
// routes/usuarios.js → VERSIÓN FINAL
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
@@ -7,10 +7,15 @@ const ctrl = require('../controllers/usuariosController');
const db = require('../db');
const bcrypt = require('bcryptjs');

// -------------------------
//      AUTH
// -------------------------
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// === NUEVAS RUTAS QUE FALTABAN ===
// -------------------------
//      PERFIL DEL USUARIO
// -------------------------
router.get('/me', auth, (req, res) => {
  res.json({
    id: req.user.id,
@@ -21,19 +26,36 @@ router.get('/me', auth, (req, res) => {
  });
});

// -------------------------
//      CAMBIAR PASSWORD
// -------------------------
router.put('/change-password', auth, async (req, res) => {
  const { actual, nueva } = req.body;
  if (!actual || !nueva) return res.status(400).json({ error: 'Faltan datos' });

  if (!actual || !nueva) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const [rows] = await db.query('SELECT password FROM usuarios WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const [rows] = await db.query(
      'SELECT password FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const passwordValido = bcrypt.compareSync(actual, rows[0].password);
    if (!passwordValido) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    if (!passwordValido) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hash = bcrypt.hashSync(nueva, 10);
    await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, req.user.id]);
    await db.query(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hash, req.user.id]
    );

    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
@@ -42,48 +64,32 @@ router.put('/change-password', auth, async (req, res) => {
  }
});

// SUBIR FOTO DE PERFIL (base64)
// -------------------------
//      SUBIR FOTO BASE64
// -------------------------
router.put('/foto', auth, async (req, res) => {
  const { foto } = req.body; // viene como data:image/jpeg;base64,.....
  const { foto } = req.body;

  // Validación básica
  if (!foto || !foto.startsWith('data:image')) {
    return res.status(400).json({ error: 'Formato de imagen inválido' });
  }

  // Opcional: limitar tamaño (ej: < 1.5MB)
  const base64Data = foto.split(',')[1];
  if (base64Data.length > 2_000_000) { // ~1.5MB
    return res.status(400).json({ error: 'Imagen demasiado grande (máx 1.5MB)' });
  }

  try {
    await db.query('UPDATE usuarios SET foto = ? WHERE id = ?', [foto, req.user.id]);
    res.json({ mensaje: 'Foto actualizada', foto });
  } catch (err) {
    console.error('Error guardando foto:', err);
    res.status(500).json({ error: 'Error al guardar foto' });
  }
});


router.put('/foto', auth, async (req, res) => {
  const { foto } = req.body;
    await db.query(
      'UPDATE usuarios SET foto = ? WHERE id = ?',
      [foto, req.user.id]
    );

  if (!foto || !foto.startsWith('data:image')) {
    return res.status(400).json({ error: 'Imagen inválida' });
  }

  try {
    await db.query('UPDATE usuarios SET foto = ? WHERE id = ?', [foto, req.user.id]);
    res.json({ mensaje: 'Foto actualizada', foto });
  } catch (err) {
    console.error('Error al guardar foto:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});
// === FIN NUEVAS RUTAS ===

// -------------------------
//      ADMIN
// -------------------------
router.get('/', auth, soloAdmin, ctrl.listUsers);
router.get('/:id', auth, soloAdmin, ctrl.getUser);
router.put('/:id', auth, soloAdmin, ctrl.updateUser);
