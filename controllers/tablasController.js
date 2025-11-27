const db = require('../db');

// =======================================
// GET tabla (anual / clausura)
// =======================================
exports.obtenerTabla = async (req, res) => {
  try {
    const { tipo } = req.params;

    if (!['anual', 'clausura'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }

    const tabla = tipo === 'anual' ? 'tabla_anual' : 'tabla_clausura';

    const [rows] = await db.query(
      `SELECT * FROM ${tabla} ORDER BY posicion ASC`
    );

    res.json(rows);
  } catch (err) {
    console.error('Error en obtenerTabla:', err);
    res.status(500).json({ error: 'Error al obtener tabla' });
  }
};

// =======================================
// POST nuevo equipo
// =======================================
exports.agregarEquipo = async (req, res) => {
  try {
    const { tipo, equipo, puntos, goles_favor, goles_contra, posicion } = req.body;

    if (!tipo || !['anual', 'clausura'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }

    if (!equipo) {
      return res.status(400).json({ error: 'El nombre del equipo es obligatorio' });
    }

    const tabla = tipo === 'anual' ? 'tabla_anual' : 'tabla_clausura';

    await db.query(
      `INSERT INTO ${tabla} (equipo, puntos, goles_favor, goles_contra, posicion)
       VALUES (?, ?, ?, ?, ?)`,
      [equipo, puntos || 0, goles_favor || 0, goles_contra || 0, posicion || null]
    );

    res.json({ mensaje: 'Equipo agregado con éxito' });
  } catch (err) {
    console.error('Error en agregarEquipo:', err);
    res.status(500).json({ error: 'Error al agregar equipo' });
  }
};

// =======================================
// PUT actualizar equipo
// =======================================
exports.actualizarEquipo = async (req, res) => {
  try {
    const { tipo, equipo, puntos, goles_favor, goles_contra, posicion } = req.body;
    const { id } = req.params;

    if (!tipo || !['anual', 'clausura'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }

    const tabla = tipo === 'anual' ? 'tabla_anual' : 'tabla_clausura';

    await db.query(
      `UPDATE ${tabla} SET equipo=?, puntos=?, goles_favor=?, goles_contra=?, posicion=?
       WHERE id=?`,
      [equipo, puntos, goles_favor, goles_contra, posicion, id]
    );

    res.json({ mensaje: 'Equipo actualizado' });
  } catch (err) {
    console.error('Error en actualizarEquipo:', err);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

// =======================================
// DELETE equipo
// =======================================
exports.eliminarEquipo = async (req, res) => {
  try {
    const { tipo } = req.body;
    const { id } = req.params;

    if (!tipo || !['anual', 'clausura'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }

    const tabla = tipo === 'anual' ? 'tabla_anual' : 'tabla_clausura';

    await db.query(`DELETE FROM ${tabla} WHERE id=?`, [id]);

    res.json({ mensaje: 'Equipo eliminado' });
  } catch (err) {
    console.error('Error en eliminarEquipo:', err);
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
};
