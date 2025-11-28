// reservasController.js
const db = require('../db');
const enviarMailReserva = require('../utils/mailer');

/* ==========================================================
   RESERVA SIN USUARIO LOGEADO (INVITADO)
   ========================================================== */
exports.crearReservaInvitado = async (req, res) => {
  try {
    const { nombre, telefono, email, fecha, hora } = req.body;

    if (!nombre || !telefono || !email || !fecha || !hora) {
      return res.status(400).json({ ok: false, mensaje: "Faltan datos obligatorios" });
    }

    // Validar formato de hora
    const [hh, mm] = hora.split(":").map(n => parseInt(n));
    if (mm !== 0) {
      return res.status(400).json({ ok: false, mensaje: "Las reservas deben ser a en punto (HH:00)" });
    }
    if (hh < 19 || hh > 22) {
      return res.status(400).json({ ok: false, mensaje: "El horario permitido es de 19:00 a 23:00" });
    }

    // Validar si ya está ocupada la hora
    const [yaExiste] = await db.query(
      "SELECT id FROM reservas WHERE fecha = ? AND hora = ?",
      [fecha, hora]
    );

    if (yaExiste.length > 0) {
      return res.status(409).json({ ok: false, mensaje: "Horario no disponible." });
    }

    // Guardar la reserva
    const insertSql = `
      INSERT INTO reservas (fecha, hora, nombre, email, telefono, estado)
      VALUES (?, ?, ?, ?, ?, 'CONFIRMADA')
    `;

    const [result] = await db.query(insertSql, [
      fecha,
      hora,
      nombre.trim(),
      email.trim(),
      telefono.trim()
    ]);

    const reservaId = result.insertId;

    // Intentar enviar email (no rompe si falla)
    try {
      await enviarMailReserva({ nombre, telefono, email, fecha, hora });
    } catch (mailErr) {
      console.error("⚠️ Error enviando email:", mailErr);
    }

    return res.json({
      ok: true,
      reservaId,
      mensaje: "Reserva creada con éxito (invitado)"
    });

  } catch (error) {
    console.error("❌ Error crítico crearReservaInvitado:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};



/* ==========================================================
   RESERVA CON USUARIO LOGEADO (TOMA DATOS DEL TOKEN)
   ========================================================== */
exports.crearReservaConUsuario = async (req, res) => {
  try {
    const { fecha, hora } = req.body;

    if (!fecha || !hora) {
      return res.status(400).json({ ok: false, mensaje: "Fecha y hora son obligatorias" });
    }

    const user = req.user; // viene de auth.js

    // Validación de hora
    const [hh, mm] = hora.split(":").map(n => parseInt(n));
    if (mm !== 0) {
      return res.status(400).json({ ok: false, mensaje: "Las reservas deben ser a en punto (HH:00)" });
    }

    if (hh < 19 || hh > 22) {
      return res.status(400).json({ ok: false, mensaje: "El horario permitido es de 19:00 a 23:00" });
    }

    // Validar si ya está ocupada
    const [yaExiste] = await db.query(
      "SELECT id FROM reservas WHERE fecha = ? AND hora = ?",
      [fecha, hora]
    );

    if (yaExiste.length > 0) {
      return res.status(409).json({ ok: false, mensaje: "Horario no disponible." });
    }

    // Insertar reserva
    const insertSql = `
      INSERT INTO reservas (fecha, hora, usuario_id, nombre, email, telefono, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMADA')
    `;

    const [result] = await db.query(insertSql, [
      fecha,
      hora,
      user.id,
      user.nombre,
      user.email,
      user.telefono || null
    ]);

    const reservaId = result.insertId;

    // Enviar email
    try {
      await enviarMailReserva({
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono || "",
        fecha,
        hora
      });
    } catch (mailErr) {
      console.error("⚠️ Error enviando email:", mailErr);
    }

    return res.json({
      ok: true,
      reservaId,
      mensaje: "Reserva creada con éxito (usuario logeado)"
    });

  } catch (error) {
    console.error("❌ Error crítico crearReservaConUsuario:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};



/* ==========================================================
   OBTENER TODAS LAS RESERVAS
   ========================================================== */
exports.obtenerReservas = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, u.nombre AS usuario_nombre
      FROM reservas r
      LEFT JOIN usuarios u ON u.id = r.usuario_id
      ORDER BY r.fecha DESC, r.hora ASC
    `);

    return res.json(rows);

  } catch (err) {
    console.error("❌ Error obtenerReservas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error al obtener reservas" });
  }
};
