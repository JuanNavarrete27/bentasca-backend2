// utils/mailer.js — Versión Nodemailer (SMTP) funcionando en Render
const nodemailer = require("nodemailer");

// Validación
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error("❌ ERROR: SMTP_USER o SMTP_PASS no están definidos.");
}

// Transporter SMTP (compatible con Render)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER, // tu Gmail o sender SMTP
    pass: process.env.SMTP_PASS, // app password
  },
});

/**
 * Enviar correo de reserva (cliente + admin)
 */
async function enviarMailReserva(reserva) {
  try {
    if (!reserva || !reserva.nombre || !reserva.fecha) {
      console.warn("⚠️ Reserva incompleta:", reserva);
      return;
    }

    const fechaBonita = new Date(reserva.fecha)
      .toLocaleDateString("es-UY", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .replace(/^\w/, (c) => c.toUpperCase());

    const html = `
      <div style="font-family: Arial; padding: 20px; background: #0f0f0f; color: white;">
        <h1 style="color: #20c35a;">Reserva confirmada</h1>
        <p><strong>Nombre:</strong> ${reserva.nombre}</p>
        <p><strong>Fecha:</strong> ${fechaBonita}</p>
        <p><strong>Hora:</strong> ${reserva.hora}h</p>
        <p><strong>Cancha:</strong> ${reserva.cancha}</p>
        <p><strong>Duración:</strong> ${reserva.duracion}h</p>
      </div>
    `;

    // ========== MAIL AL CLIENTE ==========
    if (reserva.email) {
      try {
        await transporter.sendMail({
          from: `"Bentasca" <${process.env.SMTP_USER}>`,
          to: reserva.email,
          subject: `Reserva confirmada - ${fechaBonita} ${reserva.hora}h`,
          html,
        });

        console.log("✅ Mail enviado al cliente:", reserva.email);
      } catch (err) {
        console.error("❌ Error enviando mail al cliente:", err);
      }
    }

    // ========== MAIL AL ADMIN ==========
    if (process.env.ADMIN_EMAIL) {
      try {
        await transporter.sendMail({
          from: `"Bentasca" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `NUEVA RESERVA - ${reserva.nombre}`,
          html,
        });

        console.log("📩 Mail enviado al admin:", process.env.ADMIN_EMAIL);
      } catch (err) {
        console.error("❌ Error enviando mail al admin:", err);
      }
    }

  } catch (err) {
    console.error("❌ Error general al enviar mails:", err);
  }
}

module.exports = enviarMailReserva;
