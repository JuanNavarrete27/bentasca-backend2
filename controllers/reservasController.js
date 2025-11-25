// reservasController.js
const db = require('../db');
const enviarMailReserva = require('../utils/mailer'); // ← TU FUNCIÓN BIEN HECHA

exports.crearReserva = async (req, res) => {
  try {
    const { 
      nombre, 
      telefono, 
      email, 
      fecha, 
      hora, 
      cancha, 
      duracion = 1, 
      tipo = 'F7', 
      mensaje = '' 
    } = req.body;

    // VALIDACIÓN RÁPIDA
    if (!nombre || !telefono || !fecha || !hora) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Faltan datos obligatorios'
      });
    }

    // GUARDAR EN BASE DE DATOS
    const sql = `INSERT INTO reservas (nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      nombre.trim(),
      telefono.trim(),
      email?.trim() || null,
      fecha,
      hora,
      cancha?.trim() || 'Cancha principal',
      duracion,
      tipo,
      mensaje?.trim() || ''
    ];

    let result;
    try {
      [result] = await db.query(sql, values);
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          ok: false,
          mensaje: 'Horario no disponible. Ya hay una reserva para esa fecha y hora.'
        });
      }
      throw dbError;
    }

    const reservaId = result.insertId;

    // === ENVÍO DE MAILS USANDO TU utils/mailer.js (el que ya corregimos) ===
    try {
      await enviarMailReserva({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email?.trim(),
        fecha,
        hora,
        cancha: cancha?.trim() || 'Cancha principal',
        duracion,
        tipo,
        mensaje: mensaje?.trim() || ''
      });
      console.log("Mails enviados correctamente (cliente + admin)");
    } catch (mailError) {
      console.error("Falló el envío de mails (pero la reserva SÍ se guardó):", mailError.message);
      // No rompemos nada → la reserva ya está en la DB
    }

    // RESPUESTA AL FRONTEND
    return res.json({
      ok: true,
      reservaId,
      mensaje: "Reserva creada con éxito"
    });

  } catch (error) {
    console.error("Error crítico en crearReserva:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};
