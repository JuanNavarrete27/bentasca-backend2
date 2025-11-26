// utils/mailer.js — SendGrid Dynamic Templates
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

// Template de SendGrid
const TEMPLATE_ID = "d-1291b0104f4542d89bffe656ad78ff94";

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
 * Enviar correo de reserva (cliente + admin) con Dynamic Template
 */
async function enviarMailReserva(reserva) {
  try {
    if (!reserva || !reserva.nombre || !reserva.fecha) {
      console.warn("⚠️ Reserva incompleta:", reserva);
      return;
    }

    const fechaBonita = formatFechaUY(reserva.fecha);

    // ============================
    // MAIL AL CLIENTE
    // ============================
    if (reserva.email) {
      try {
        await sgMail.send({
          to: reserva.email,
          from: process.env.FROM_EMAIL,
          templateId: TEMPLATE_ID,
          dynamicTemplateData: {
            nombre: reserva.nombre,
            fecha: fechaBonita,
            hora: reserva.hora,
            email: reserva.email,
            telefono: reserva.telefono
          }
        });

        console.log("✅ Mail dinámico enviado al cliente:", reserva.email);

      } catch (err) {
        console.error("❌ Error enviando mail al cliente:", err.response?.body || err.message);
      }
    }

    // ============================
    // MAIL AL ADMIN
    // ============================
    if (process.env.ADMIN_EMAIL) {
      try {
        await sgMail.send({
          to: process.env.ADMIN_EMAIL,
          from: process.env.FROM_EMAIL,
          templateId: TEMPLATE_ID,
          dynamicTemplateData: {
            nombre: reserva.nombre,
            fecha: fechaBonita,
            hora: reserva.hora,
            email: reserva.email,
            telefono: reserva.telefono
          }
        });

        console.log("📩 Mail dinámico enviado al admin:", process.env.ADMIN_EMAIL);

      } catch (err) {
        console.error("❌ Error enviando mail al admin:", err.response?.body || err.message);
      }
    }

  } catch (err) {
    console.error("❌ Error general en enviarMailReserva:", err.message);
  }
}

module.exports = enviarMailReserva;
