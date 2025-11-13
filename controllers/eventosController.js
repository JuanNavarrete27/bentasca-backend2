
const db = require('../db');
exports.obtenerEventos = async (req, res) => {
  try { const [rows] = await db.query('SELECT * FROM eventos ORDER BY fecha DESC'); res.json(rows); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};
exports.crearEvento = async (req, res) => {
  const { titulo, descripcion, fecha, estado } = req.body;
  try { await db.query('INSERT INTO eventos (titulo, descripcion, fecha, estado) VALUES (?, ?, ?, ?)', [titulo, descripcion, fecha, estado || 'ACTIVO']); res.json({ mensaje: 'Evento creado' }); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};

