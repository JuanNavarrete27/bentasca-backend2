// middlewares/auth.js → VERSIÓN QUE FUNCIONA 100% CON TU PROYECTO
const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');

    const [rows] = await db.query(
      'SELECT id, nombre, apellido, email, rol, foto, created_at FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = rows[0]; // ← ESTO ES LO QUE FALTABA
    next();
  } catch (err) {
    console.error('Error auth:', err.message);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
