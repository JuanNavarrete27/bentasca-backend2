// controllers/usuariosController.js
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function normalizarFoto(foto) {
  if (!foto) return null;
  const invalido = ['0', 'default', 'undefined', 'null', ''];
  if (invalido.includes(String(foto).trim())) return null;
  return foto;
}

// ====================== REGISTER ======================
exports.register = async (req, res) => {
  const { nombre, apellido, email, password, rol } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const [exists] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (exists.length > 0) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = bcrypt.hashSync(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre || '', apellido || '', email, hash, rol || 'user']
    );

    res.status(201).json({ mensaje: 'Usuario creado', id: result.insertId });
  } catch (err) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error en registro' });
  }
};

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        foto: normalizarFoto(user.foto)
      },
      process.env.JWT_SECRET || 'changeme',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email,
        rol: user.rol,
        foto: normalizarFoto(user.foto)
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error en login' });
  }
};

// ====================== ADMIN HELPERS ======================
exports.listUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, apellido, email, rol, foto FROM usuarios');
    res.json(rows.map(u => ({ ...u, foto: normalizarFoto(u.foto) })));
  } catch (err) {
    console.error('Error listUsers:', err);
    res.status(500).json({ error: 'Error listando usuarios' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, email, rol, foto FROM usuarios WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const u = rows[0];
    res.json({ ...u, foto: normalizarFoto(u.foto) });
  } catch (err) {
    console.error('Error getUser:', err);
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
};

exports.updateUser = async (req, res) => {
  const { nombre, apellido, rol, foto } = req.body;
  try {
    await db.query(
      'UPDATE usuarios SET nombre = ?, apellido = ?, rol = ?, foto = ? WHERE id = ?',
      [nombre, apellido, rol, foto, req.params.id]
    );
    res.json({ mensaje: 'Usuario actualizado' });
  } catch (err) {
    console.error('Error updateUser:', err);
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    console.error('Error deleteUser:', err);
    res.status(500).json({ error: 'Error eliminando usuario' });
  }
};
