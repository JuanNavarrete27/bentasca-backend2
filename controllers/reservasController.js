// reservasController.js
const db = require('../db');
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY?.trim(),
});

const TEMPLATE_ID = "0r83ql3yx7pgzw1j";

exports.crearReserva = async (req, res) => {
  try {
    const { nombre, telefono, email, fecha, hora, cancha, duracion = 1, tipo = 'F7', mensaje = '' } = req.body;

    // GUARDAR EN DB
    const sql = `INSERT INTO reservas (nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      nombre?.trim(),
      telefono?.trim(),
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

    // DATOS PARA EL TEMPLATE
    const data = {
      nombre: nombre?.trim() || 'Cliente',
      fecha, hora,
      cancha: cancha?.trim() || 'Cancha principal',
      duracion,
      personas: duracion,
      telefono: telefono?.trim() || '',
      email: email?.trim() || '',
      mensaje: mensaje?.trim() || 'Sin mensaje adicional',
    };

    // === ENVÍO DE MAILS CON MAILERSEND (SOLO CAMBIO AQUÍ) ===
    try {
      // USAMOS EL SENDER DE PRUEBA DE MAILERSEND (NO REQUIERE UPGRADE NI VERIFICACIÓN)
      const from = new Sender("MS_0r83ql3y@trial-mailersend.net", "Bentasca");

      // Mail al cliente
      if (email && email.includes('@')) {
        await mailer.email.send(new EmailParams()
          .setFrom(from)
          .setTo([new Recipient(email.trim(), nombre)])
          .setReplyTo("no-reply@bentasca.com")
          .setSubject("¡Tu reserva en Bentasca está confirmada!")
          .setTemplateId(TEMPLATE_ID)
          .setPersonalization([{ email: email.trim(), data }])
        );
        console.log("Mail enviado al cliente:", email);
      }

      // Mail al admin
      if (process.env.MAILERSEND_ADMIN?.includes('@')) {
        await mailer.email.send(new EmailParams()
          .setFrom(from)
          .setTo([new Recipient(process.env.MAILERSEND_ADMIN.trim(), "Admin")])
          .setSubject(`Nueva reserva - ${nombre} - ${fecha} ${hora}h`)
          .setTemplateId(TEMPLATE_ID)
          .setPersonalization([{ email: process.env.MAILERSEND_ADMIN.trim(), data }])
        );
        console.log("Mail enviado al admin:", process.env.MAILERSEND_ADMIN);
      }

    } catch (emailError) {
      console.error("Error enviando mails (reserva OK):", emailError.message);
    }

    return res.json({
      ok: true,
      reservaId,
      mensaje: "Reserva creada con éxito"
    });

  } catch (error) {
    console.error("Error crítico:", error);
    return res.status(500).json({ ok: false, mensaje: "Error del servidor" });
  }
};
