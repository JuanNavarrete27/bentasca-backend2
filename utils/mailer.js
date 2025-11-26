// utils/mailer.js — Versión SendGrid API (sin SMTP)
const sgMail = require('@sendgrid/mail');

// Validación de entorno
if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ ERROR: Falta SENDGRID_API_KEY en variables de entorno.");
}
if (!process.env.FROM_EMAIL) {
  console.error("❌ ERROR: Falta FROM_EMAIL (remitente) en variables de entorno.");
}
if (!process.env.ADMIN_EMAIL) {
  console.warn("⚠️ Advertencia: Falta ADMIN_EMAIL (mail a donde llegan las reservas).");
}

// Configurar API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Formatea fecha en estilo uruguayo
 */
function formatFechaUY(rawDate) {
  try {
    const d = new Date(rawDate);
    if (isNaN(d)) return rawDate;

    return d.toLocaleDateString("es-UY", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).replace(/^\w/, (c) => c.toUpperCase());
  } catch {
    return rawDate;
  }
}

/**
 * Construye HTML del mail
 */
function buildReservaHTML(reserva, fechaBonita) {
  return `
    <div style="font-family: Arial; padding: 20px; background: #0f0f0f; color: white;">
      <h1 style="color: #20c35a;">Reserva confirmada</h1>
      <p><strong>Nombre:</strong> ${reserva.nombre}</p>
      <p><strong>Fecha:</strong> ${fechaBonita}</p>
      <p><strong>Hora:</strong> ${reserva.hora}h</p>
      <p><strong>Cancha:</strong> ${reserva.cancha}</p>
      <p><strong>Duración:</strong> ${reserva.duracion}h</p>
      ${reserva.mensaje ? `<p><strong>Mensaje:</strong> ${reserva.mensaje}</p>` : ""}
    </div>
  `;
}

/**
 * Enviar correo de reserva (cliente + admin) usando SendGrid
 */
async function enviarMailReserva(reserva) {
  try {
    if (!reserva || !reserva.nombre || !reserva.fecha) {
      console.warn("⚠️ Reserva incompleta:", reserva);
      return;
    }

    const fechaBonita = formatFechaUY(reserva.fecha);
    const html = buildReservaHTML(reserva, fechaBonita);

    // ============================
    // MAIL AL CLIENTE
    // ============================
    if (reserva.email) {
      try {
        await sgMail.send({
          from: process.env.FROM_EMAIL,
          to: reserva.email,
          subject: `Reserva confirmada - ${fechaBonita} ${reserva.hora || ""}h`,
          html,
        });
        console.log("✅ Mail enviado al cliente:", reserva.email);
      } catch (err) {
        console.error("❌ Error enviando mail al cliente:", err.message);
      }
    }

    // ============================
    // MAIL AL ADMIN
    // ============================
    if (process.env.ADMIN_EMAIL) {
      try {
        await sgMail.send({
          from: process.env.FROM_EMAIL,
          to: process.env.ADMIN_EMAIL,
          subject: `NUEVA RESERVA - ${reserva.nombre}`,
          html,
        });
        console.log("📩 Mail enviado al admin:", process.env.ADMIN_EMAIL);
      } catch (err) {
        console.error("❌ Error enviando mail al admin:", err.message);
      }
    }

  } catch (err) {
    console.error("❌ Error general en enviarMailReserva:", err.message);
  }
}

module.exports = enviarMailReserva;
