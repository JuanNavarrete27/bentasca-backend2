const db = require('../db');

exports.obtenerEventos = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM eventos ORDER BY fecha DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};

exports.crearEvento = async (req, res) => {
  const { titulo, descripcion, fecha, estado } = req.body;
  try {
    await db.query(
      'INSERT INTO eventos (titulo, descripcion, fecha, estado) VALUES (?, ?, ?, ?)',
      [titulo, descripcion, fecha, estado || 'ACTIVO']
    );
    res.json({ mensaje: 'Evento creado' });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};

exports.actualizarEvento = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, fecha, estado } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE eventos SET titulo = ?, descripcion = ?, fecha = ?, estado = ? WHERE id = ?',
      [titulo, descripcion, fecha, estado, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json({ mensaje: 'Evento actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};

exports.eliminarEvento = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM eventos WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json({ mensaje: 'Evento eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};
