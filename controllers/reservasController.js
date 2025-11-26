// reservasController.js
const db = require('../db');
const enviarMailReserva = require('../utils/mailer');

/**
 * Crear una reserva
 */
exports.crearReserva = async (req, res) => {
  try {
    const { 
      nombre, 
      telefono, 
      email, 
      fecha, 
      hora, 
      cancha = "Principal", 
      duracion = 1, 
      tipo = "F7", 
      mensaje = "" 
    } = req.body;

    // --- VALIDACIÓN BÁSICA ---
    if (!nombre || !telefono || !email || !fecha || !hora) {
      return res.status(400).json({
        ok: false,
        mensaje: "Faltan datos obligatorios"
      });
    }

    // --- VALIDACIÓN HORARIA ---
    const [hh, mm] = hora.split(":").map(n => parseInt(n, 10));
    if (mm !== 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "Las reservas deben comenzar en punto (XX:00)"
      });
    }
    if (hh < 19 || hh > 22) {
      return res.status(400).json({
        ok: false,
        mensaje: "El horario permitido es de 19:00 a 23:00"
      });
    }
    if (![1, 2].includes(Number(duracion))) {
      return res.status(400).json({
        ok: false,
        mensaje: "La duración debe ser 1 o 2 horas"
      });
    }

    // --- VALIDAR SOLAPAMIENTO DE RESERVAS ---
    const checkSql = `
      SELECT * FROM reservas
      WHERE fecha = ?
      AND cancha = ?
      AND (
        (hora = ?) OR
        (TIME(hora) = TIME(DATE_ADD(?, INTERVAL 1 HOUR)))
      )
    `;
    const [existe] = await db.query(checkSql, [fecha, cancha, hora, hora]);
    if (existe.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: "Horario no disponible. Ya hay una reserva en esa franja."
      });
    }

    // --- GUARDAR EN DB ---
    const insertSql = `
      INSERT INTO reservas (nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      nombre.trim(),
      telefono.trim(),
      email.trim(),
      fecha,
      hora,
      cancha.trim(),
      duracion,
      tipo,
      mensaje.trim()
    ];

    let result;
    try {
      [result] = await db.query(insertSql, values);
    } catch (dbError) {
      console.error("❌ Error DB:", dbError);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al guardar la reserva"
      });
    }

    const reservaId = result.insertId;

    // --- ENVÍO DE MAIL (no rompe la reserva si falla) ---
    try {
      await enviarMailReserva({
        nombre,
        telefono,
        email,
        fecha,
        hora,
        cancha,
        duracion,
        tipo,
        mensaje
      });
      console.log("📧 Mails enviados correctamente");
    } catch (mailError) {
      console.error("⚠️ Error enviando mails (reserva guardada):", mailError);
    }

    // --- RESPUESTA ---
    return res.json({
      ok: true,
      reservaId,
      mensaje: "Reserva creada con éxito"
    });

  } catch (error) {
    console.error("❌ Error crítico en crearReserva:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};
