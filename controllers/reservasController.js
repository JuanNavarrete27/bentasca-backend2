const db = require('../db');
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

exports.crearReserva = async (req, res) => {
  try {
    const { nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje } = req.body;

    const sql = `
      INSERT INTO reservas 
      (nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nombre,
      telefono,
      email || null,
      fecha,
      hora,
      cancha || 'Cancha principal',
      duracion || 1,
      tipo || 'F7',
      mensaje || ''
    ];

    let insertResult;
    try {
      const [result] = await db.query(sql, values);
      insertResult = result;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          error: 'Ya hay una reserva para esa fecha, hora y cancha'
        });
      }
      throw err;
    }

    //----------------------------------------------------
    // HTML del email
    //----------------------------------------------------

    const htmlEmail = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Reserva confirmada</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Hora:</strong> ${hora}</p>
        <p><strong>Cancha:</strong> ${cancha}</p>
        <p><strong>Duración:</strong> ${duracion} hora/s</p>
        ${mensaje ? `<p><strong>Mensaje:</strong> ${mensaje}</p>` : ""}
        <hr>
        <p>Gracias por reservar en Bentasca ⚽</p>
      </div>
    `;

    //----------------------------------------------------
    // Envío al cliente (si ingresó email)
    //----------------------------------------------------

    if (email) {
      const from = new Sender(process.env.MAILERSEND_FROM, "Bentasca");
      const to = [new Recipient(email, nombre)];

      const emailParams = new EmailParams()
        .setFrom(from)
        .setTo(to)
        .setSubject("Reserva confirmada ✔")
        .setHtml(htmlEmail);

      await mailer.email.send(emailParams);
    }

    //----------------------------------------------------
    // Envío al administrador
    //----------------------------------------------------

    const fromAdmin = new Sender(process.env.MAILERSEND_FROM, "Bentasca");
    const toAdmin = [new Recipient(process.env.MAILERSEND_ADMIN, "Admin")];

    const adminParams = new EmailParams()
      .setFrom(fromAdmin)
      .setTo(toAdmin)
      .setSubject("Nueva reserva recibida")
      .setHtml(htmlEmail);

    await mailer.email.send(adminParams);

    //----------------------------------------------------

    res.json({
      ok: true,
      reservaId: insertResult.insertId
    });

  } catch (error) {
    console.error("Error en crearReserva:", error);
    res.status(500).json({ error: 'Error interno al crear la reserva' });
  }
};
