// middlewares/auth.js
const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ error: 'Acceso denegado' });

  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    
    // ←←← CLAVE: CARGAR EL USUARIO COMPLETO DE LA DB
    const [rows] = await db.query('SELECT id, nombre, apellido, email, rol, foto FROM usuarios WHERE id = ?', [decoded.id]);
    if (rows.length === 0) return res.status(401).json({ error: 'Token inválido' });

    req.user = rows[0]; // ← AHORA req.user tiene nombre, foto, etc.
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
