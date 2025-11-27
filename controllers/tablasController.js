const db = require('../db');

// ======================================================
// ANUAL
// ======================================================
exports.obtenerTablaAnual = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM tabla_anual ORDER BY posicion ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en obtenerTablaAnual:', err);
    res.status(500).json({ error: 'Error al obtener tabla anual' });
  }
};

exports.agregarEquipoAnual = async (req, res) => {
  try {
    const { equipo, puntos, goles_favor, goles_contra, posicion } = req.body;

    if (!equipo) {
      return res.status(400).json({ error: 'El nombre del equipo es obligatorio' });
    }

    await db.query(
      `INSERT INTO tabla_anual (equipo, puntos, goles_favor, goles_contra, posicion)
       VALUES (?, ?, ?, ?, ?)`,
      [
        equipo,
        puntos ?? 0,
        goles_favor ?? 0,
        goles_contra ?? 0,
        posicion ?? null
      ]
    );

    res.json({ mensaje: 'Equipo agregado a tabla anual' });
  } catch (err) {
    console.error('Error en agregarEquipoAnual:', err);
    res.status(500).json({ error: 'Error al agregar equipo' });
  }
};

exports.actualizarEquipoAnual = async (req, res) => {
  try {
    const { equipo, puntos, goles_favor, goles_contra, posicion } = req.body;
    const { id } = req.params;

    await db.query(
      `UPDATE tabla_anual
       SET equipo=?, puntos=?, goles_favor=?, goles_contra=?, posicion=?
       WHERE id=?`,
      [equipo, puntos, goles_favor, goles_contra, posicion, id]
    );

    res.json({ mensaje: 'Equipo anual actualizado' });
  } catch (err) {
    console.error('Error en actualizarEquipoAnual:', err);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

exports.eliminarEquipoAnual = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`DELETE FROM tabla_anual WHERE id=?`, [id]);

    res.json({ mensaje: 'Equipo anual eliminado' });
  } catch (err) {
    console.error('Error en eliminarEquipoAnual:', err);
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
};



// ======================================================
// CLAUSURA
// ======================================================
exports.obtenerTablaClausura = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM tabla_clausura ORDER BY posicion ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en obtenerTablaClausura:', err);
    res.status(500).json({ error: 'Error al obtener tabla clausura' });
  }
};

exports.agregarEquipoClausura = async (req, res) => {
  try {
    const { equipo, puntos, goles_favor, goles_contra, posicion } = req.body;

    if (!equipo) {
      return res.status(400).json({ error: 'El nombre del equipo es obligatorio' });
    }

    await db.query(
      `INSERT INTO tabla_clausura (equipo, puntos, goles_favor, goles_contra, posicion)
       VALUES (?, ?, ?, ?, ?)`,
      [
        equipo,
        puntos ?? 0,
        goles_favor ?? 0,
        goles_contra ?? 0,
        posicion ?? null
      ]
    );

    res.json({ mensaje: 'Equipo agregado a tabla clausura' });
  } catch (err) {
    console.error('Error en agregarEquipoClausura:', err);
    res.status(500).json({ error: 'Error al agregar equipo' });
  }
};

exports.actualizarEquipoClausura = async (req, res) => {
  try {
    const { equipo, puntos, goles_favor, goles_contra, posicion } = req.body;
    const { id } = req.params;

    await db.query(
      `UPDATE tabla_clausura
       SET equipo=?, puntos=?, goles_favor=?, goles_contra=?, posicion=?
       WHERE id=?`,
      [equipo, puntos, goles_favor, goles_contra, posicion, id]
    );

    res.json({ mensaje: 'Equipo clausura actualizado' });
  } catch (err) {
    console.error('Error en actualizarEquipoClausura:', err);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

exports.eliminarEquipoClausura = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`DELETE FROM tabla_clausura WHERE id=?`, [id]);

    res.json({ mensaje: 'Equipo clausura eliminado' });
  } catch (err) {
    console.error('Error en eliminarEquipoClausura:', err);
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
};
