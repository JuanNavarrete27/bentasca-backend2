const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Normalizar foto para frontend
function normalizarFoto(foto) {
  if (!foto) return null;
  const invalido = ["0", "default", "undefined", "null", ""];
  if (invalido.includes(foto.trim())) return null;
  return foto;
}
// ==================== REGISTER ====================
exports.register = async (req, res) => {
  const { nombre, apellido, email, password, rol } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password requeridos' });
  }
  try {
    const [exists] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (exists.length > 0) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }
    const hash = bcrypt.hashSync(password, 10);
    // FOTO DEFAULT = NULL
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol, foto) VALUES (?, ?, ?, ?, ?, NULL)',
      [nombre || '', apellido || '', email, hash, rol || 'user']
    );
    res.status(201).json({ mensaje: 'Usuario creado', id: result.insertId });
  } catch (err) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};
// ==================== LOGIN ====================
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password requeridos' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const user = rows[0];
    const passwordValido = bcrypt.compareSync(password, user.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre || '',
        apellido: user.apellido || ''
      },
      process.env.JWT_SECRET || 'changeme',
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        foto: normalizarFoto(user.foto)
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};
// ==================== LISTAR USUARIOS (solo admin) ====================
exports.listUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, apellido, email, rol, foto FROM usuarios');
   
    const usuarios = rows.map(u => ({
      ...u,
      foto: normalizarFoto(u.foto)
    }));
    res.json(usuarios);
  } catch (err) {
    console.error('Error en listUsers:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};
// ==================== OBTENER UN USUARIO ====================
exports.getUser = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, email, rol, foto FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = rows[0];
    user.foto = normalizarFoto(user.foto);
    res.json(user);
  } catch (err) {
    console.error('Error en getUser:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};
// ==================== ACTUALIZAR USUARIO ====================
exports.updateUser = async (req, res) => {
  const { nombre, apellido, email, password, rol, foto } = req.body;
  const campos = [];
  const valores = [];
  if (nombre !== undefined) { campos.push('nombre = ?'); valores.push(nombre); }
  if (apellido !== undefined) { campos.push('apellido = ?'); valores.push(apellido); }
  if (email !== undefined) { campos.push('email = ?'); valores.push(email); }
  if (rol !== undefined) { campos.push('rol = ?'); valores.push(rol); }
  // Foto: si mandan algo inválido → guardo NULL
  if (foto !== undefined) {
    campos.push('foto = ?');
    valores.push(normalizarFoto(foto));
  }
  try {
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      campos.push('password = ?');
      valores.push(hash);
    }
    if (campos.length === 0) {
      return res.status(400).json({ error: 'Nada para actualizar' });
    }
    valores.push(req.params.id);
    await db.query(
      UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?,
      valores
    );
    res.json({ mensaje: 'Usuario actualizado' });
  } catch (err) {
    console.error('Error en updateUser:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};
// ==================== ELIMINAR USUARIO ====================
exports.deleteUser = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    console.error('Error en deleteUser:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};
