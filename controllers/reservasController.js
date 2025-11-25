// reservasController.js  ← este es el nombre correcto del archivo
const db = require('../db');
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY?.trim(),
});

const TEMPLATE_ID = "0r83ql3yx7pgzw1j";

exports.crearReserva = async (req, res) => {
  let reservaGuardada = false;
  let reservaId = null;

  try {
    const { nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje } = req.body;

    // --- 1. GUARDAR EN BASE DE DATOS (esto nunca debe fallar la respuesta) ---
    const sql = `
      INSERT INTO reservas
      (nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nombre?.trim(),
      telefono?.trim(),
      email?.trim() || null,
      fecha,
      hora,
      cancha?.trim() || 'Cancha principal',
      duracion || 1,
      tipo || 'F7',
      mensaje?.trim() || ''
    ];

    const [result] = await db.query(sql, values);
    reservaGuardada = true;
    reservaId = result.insertId;

    // --- 2. DATOS PARA EL TEMPLATE ---
    const personalizationData = {
      nombre: nombre?.trim() || 'Cliente',
      fecha,
      hora,
      cancha: cancha?.trim() || 'Cancha principal',
      duracion: duracion || 1,
      personas: duracion || 1,
      telefono: telefono?.trim() || '',
      email: email?.trim() || '',
      mensaje: mensaje?.trim() || 'Sin mensaje adicional',
    };

    // --- 3. ENVÍO DE EMAILS (con try-catch separado para no romper todo) ---
    try {
      const from = new Sender(process.env.MAILERSEND_FROM, "Bentasca");

      // Email al cliente
      if (email && email.includes('@')) {
        const clienteParams = new EmailParams()
          .setFrom(from)
          .setTo([new Recipient(email.trim(), nombre)])
          .setReplyTo(process.env.MAILERSEND_ADMIN)
          .setSubject("¡Tu reserva en Bentasca está confirmada!")
          .setTemplateId(TEMPLATE_ID)
          .setPersonalization([{
            email: email.trim(),
            data: personalizationData
          }]);

        await mailer.email.send(clienteParams);
        console.log("Email enviado al cliente:", email);
      }

      // Email al admin (siempre)
      if (process.env.MAILERSEND_ADMIN && process.env.MAILERSEND_ADMIN.includes('@')) {
        const adminParams = new EmailParams()
          .setFrom(from)
          .setTo([new Recipient(process.env.MAILERSEND_ADMIN.trim(), "Admin Bentasca")])
          .setSubject(`Nueva reserva - ${nombre} - ${fecha} ${hora}`)
          .setTemplateId(TEMPLATE_ID)
          .setPersonalization([{
            email: process.env.MAILERSEND_ADMIN.trim(),
            data: personalizationData
          }]);

        await mailer.email.send(adminParams);
        console.log("Email enviado al admin:", process.env.MAILERSEND_ADMIN);
      }

    } catch (emailError) {
      // ¡Importante! Solo logueamos, pero NO rompemos la reserva
      console.error("Error enviando emails (reserva OK):", {
        message: emailError.message,
        body: emailError.body || 'Sin body',
        code: emailError.code || 'N/A'
      });
    }

    // --- 4. RESPUESTA SIEMPRE EXITOSA SI LA RESERVA SE GUARDÓ ---
    return res.json({
      ok: true,
      reservaId,
      mensaje: "Reserva creada con éxito"
    });

  } catch (error) {
    // Solo llega aquí si falla la DB o algo crítico
    console.error("Error crítico en crearReserva:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Si la reserva no se guardó → 500
    if (!reservaGuardada) {
      return res.status(500).json({
        error: 'Error interno al crear la reserva',
        debug: error.message
      });
    }

    // Si la reserva SÍ se guardó pero falló algo más → igual devolvemos OK
    return res.json({
      ok: true,
      reservaId,
      mensaje: "Reserva guardada (emails con problemas)"
    });
  }
};
