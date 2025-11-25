// mailer.js — MailerSend oficial con API Token
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY
});

// email que verás como remitente
const sender = new Sender(
  "noreply@bentasca.com",   // debe ser dominio verificado en MailerSend
  "Bentasca"
);

/**
 * Enviar correo de reserva
 * @param {object} reserva
 */
async function enviarMailReserva(reserva) {
  try {
    const recipients = [
      new Recipient(reserva.email || process.env.SMTP_ADMIN, reserva.nombre)
    ];

    const html = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Reserva confirmada</h2>

        <p><strong>Nombre:</strong> ${reserva.nombre}</p>
        <p><strong>Teléfono:</strong> ${reserva.telefono}</p>
        <p><strong>Fecha:</strong> ${reserva.fecha}</p>
        <p><strong>Hora:</strong> ${reserva.hora}</p>
        <p><strong>Cancha:</strong> ${reserva.cancha}</p>
        <p><strong>Duración:</strong> ${reserva.duracion} hora/s</p>
        <p><strong>Tipo:</strong> ${reserva.tipo}</p>
        ${reserva.mensaje ? `<p><strong>Mensaje:</strong> ${reserva.mensaje}</p>` : ""}
        
        <br>
        <p>Ubicación: <a href="https://maps.app.goo.gl/gx3WY1hgbot16C8f8">Google Maps</a></p>
        <hr>
        <p style="color:#555">Gracias por reservar en Bentasca ⚽</p>
      </div>
    `;

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject(`Reserva confirmada - ${reserva.fecha} ${reserva.hora}`)
      .setHtml(html);

    await mailer.email.send(emailParams);

    // enviar copia al admin
    if (reserva.email) {
      const adminRecipients = [
        new Recipient(process.env.SMTP_ADMIN, "Administrador")
      ];

      const adminParams = new EmailParams()
        .setFrom(sender)
        .setTo(adminRecipients)
        .setSubject("Nueva reserva")
        .setHtml(html);

      await mailer.email.send(adminParams);
    }

  } catch (error) {
    console.error("Error enviando email:", error);
  }
}

module.exports = enviarMailReserva;
