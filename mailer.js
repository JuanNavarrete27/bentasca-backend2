const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Función para enviar un mail
async function enviarMailReserva(reserva) {
  const mailOptions = {
    from: `"Bentasca" <${process.env.SMTP_USER}>`,
    to: reserva.email || process.env.SMTP_USER, // si el cliente no pone email, te llega a vos
    subject: `Reserva confirmada - ${reserva.fecha} ${reserva.hora}`,
    html: `
      <h2>Reserva confirmada</h2>
      <p><strong>Nombre:</strong> ${reserva.nombre} ${reserva.apellido || ''}</p>
      <p><strong>Teléfono:</strong> ${reserva.telefono}</p>
      <p><strong>Fecha:</strong> ${reserva.fecha}</p>
      <p><strong>Hora:</strong> ${reserva.hora}</p>
      <p><strong>Tipo:</strong> ${reserva.tipo}</p>
      <p><strong>Duración:</strong> ${reserva.duracion} hora(s)</p>
      <p><strong>Mensaje:</strong> ${reserva.mensaje || '—'}</p>

      <br>
      <p>¡Gracias por reservar con nosotros!</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = enviarMailReserva;
