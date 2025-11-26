// utils/mailer.js — Versión Nodemailer (SMTP) optimizada para Render
const nodemailer = require("nodemailer");

// Validaciones de entorno
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error("❌ ERROR: Falta SMTP_USER o SMTP_PASS en variables de entorno.");
}
if (!process.env.ADMIN_EMAIL) {
  console.warn("⚠️ Advertencia: Falta ADMIN_EMAIL (mail a donde llegan las reservas).");
}

// Transporter SMTP compatible con Render + Gmail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Necesario en muchos despliegues Render
  }
});

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
 * Enviar correo de reserva (cliente + admin)
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
        await transporter.sendMail({
          from: `Bentasca <${process.env.SMTP_USER}>`,
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
        await transporter.sendMail({
          from: `Bentasca <${process.env.SMTP_USER}>`,
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
