// utils/mailer.js — versión corregida con logs completos para Render
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

// Validación de API Key
if (!process.env.MAILERSEND_API_KEY) {
  console.error("⚠️ MAILERSEND_API_KEY NO ESTÁ DEFINIDA en variables de entorno");
}
const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY?.trim(),
});

// Sender de prueba (trial MailerSend)
const sender = new Sender("MS_0r83ql3y@trial-mailersend.net", "Bentasca");

/**
 * Enviar correo de reserva (cliente + admin)
 * @param {object} reserva
 */
async function enviarMailReserva(reserva) {
  try {
    // Validación de reserva mínima
    if (!reserva || !reserva.nombre || !reserva.fecha) {
      console.warn("⚠️ Reserva incompleta:", reserva);
      return;
    }

    const fechaBonita = new Date(reserva.fecha).toLocaleDateString('es-UY', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase());

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0f0f0f; color: white; border: 4px solid #20c35a; border-radius: 20px; text-align: center;">
        <h1 style="color: #20c35a; margin-bottom: 20px;">RESERVA CONFIRMADA</h1>
        <h2>¡Hola ${reserva.nombre}!</h2>
        <div style="background: rgba(32,195,90,0.2); padding: 25px; border-radius: 16px; margin: 25px 0;">
          <p style="margin: 10px 0; font-size: 22px;"><strong>Fecha:</strong> ${fechaBonita}</p>
          <p style="margin: 10px 0; font-size: 28px; color: #20c35a;"><strong>Hora:</strong> ${reserva.hora}h</p>
          <p style="margin: 10px 0;"><strong>Cancha:</strong> ${reserva.cancha || 'Principal'}</p>
          <p style="margin: 10px 0;"><strong>Duración:</strong> ${reserva.duracion}h</p>
        </div>
        <p style="font-size: 18px;">¡Nos vemos en la cancha!</p>
        <p style="margin-top: 30px; color: #888; font-size: 14px;">
          <a href="https://maps.app.goo.gl/gx3WY1hgbot16C8f8" style="color: #20c35a;">Ver ubicación en Google Maps</a>
        </p>
        <hr style="border: 1px solid #333; margin: 30px 0;">
        <p style="color: #20c35a; font-size: 20px;">Bentasca ⚽</p>
      </div>
    `;

    // --- MAIL AL CLIENTE ---
    if (reserva.email && reserva.email.includes('@')) {
      try {
        const clienteParams = new EmailParams()
          .setFrom(sender)
          .setTo([new Recipient(reserva.email.trim(), reserva.nombre)])
          .setSubject(`¡Reserva confirmada! - ${fechaBonita} ${reserva.hora}h`)
          .setHtml(html);

        await mailer.email.send(clienteParams);
        console.log("✅ Mail enviado al cliente:", reserva.email);
      } catch (errCliente) {
        console.error("❌ Error enviando mail al cliente:", errCliente);
      }
    } else {
      console.warn("⚠️ No se envía mail al cliente, email inválido o no definido:", reserva.email);
    }

    // --- MAIL AL ADMIN ---
    if (process.env.MAILERSEND_ADMIN?.includes('@')) {
      try {
        const adminHtml = html.replace('¡Hola ' + reserva.nombre + '!', 'Nueva reserva recibida');
        const adminParams = new EmailParams()
          .setFrom(sender)
          .setTo([new Recipient(process.env.MAILERSEND_ADMIN.trim(), "Admin")])
          .setSubject(`NUEVA RESERVA - ${reserva.nombre} - ${fechaBonita} ${reserva.hora}h`)
          .setHtml(adminHtml);

        await mailer.email.send(adminParams);
        console.log("✅ Mail enviado al admin:", process.env.MAILERSEND_ADMIN);
      } catch (errAdmin) {
        console.error("❌ Error enviando mail al admin:", errAdmin);
      }
    } else {
      console.warn("⚠️ MAILERSEND_ADMIN no definido o inválido");
    }

  } catch (errorGeneral) {
    console.error("❌ Error general enviando mails (reserva guardada OK):", errorGeneral);
  }
}

module.exports = enviarMailReserva;
