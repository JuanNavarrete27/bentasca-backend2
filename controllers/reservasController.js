const db = require('../db');
const nodemailer = require('nodemailer');
const path = require('path');

exports.crearReserva = async (req, res) => {
  try {
    const { nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje } = req.body;

    const sql = `
      INSERT INTO reservas 
      (nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      nombre, telefono,
      email || null,
      fecha, hora,
      cancha || 'Cancha principal',
      duracion || 1,
      tipo || 'F7',
      mensaje || ''
    ];

    db.query(sql, values, async (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Ya hay una reserva para esa fecha, hora y cancha' });
        }
        console.error(err);
        return res.status(500).json({ error: 'Error al crear la reserva' });
      }

      // ============================
      //   NODEMAILER
      // ============================
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Ruta al logo (lo dejamos en /public o /assets del backend)
      const logoPath = path.join(__dirname, '../public/logo.png');

      const emailHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <div style="text-align: center;">
            <img src="cid:logoBentasca" style="width: 140px; margin-bottom: 20px;" />
          </div>

          <h2 style="text-align:center; color:#111;">Reserva confirmada</h2>

          <p>Hola <strong>${nombre}</strong>, tu reserva se confirmó correctamente.</p>

          <h3>Detalles de la reserva:</h3>
          <ul>
            <li><strong>Fecha:</strong> ${fecha}</li>
            <li><strong>Hora:</strong> ${hora}</li>
            <li><strong>Cancha:</strong> ${cancha || 'Cancha principal'}</li>
            <li><strong>Tipo:</strong> ${tipo}</li>
            <li><strong>Duración:</strong> ${duracion} hora(s)</li>
          </ul>

          <p><strong>Ubicación:</strong> <a href="https://maps.app.goo.gl/gx3WY1hgbot16C8f8">Ver en Google Maps</a></p>

          <p>Gracias por reservar en <strong>Bentasca</strong>. ¡Te esperamos! ⚽</p>

          <hr>
          <p style="font-size:12px; color:#888; text-align:center;">
            Bentasca — Fútbol 7 · El mejor sintético de la zona
          </p>
        </div>
      `;

      // Cliente + Admin
      const destinatarios = [email, process.env.EMAIL_USER].filter(Boolean);

      await transporter.sendMail({
        from: `"Bentasca" <${process.env.EMAIL_USER}>`,
        to: destinatarios,
        subject: 'Reserva confirmada - Bentasca',
        html: emailHTML,
        attachments: [
          {
            filename: 'logo.png',
            path: logoPath,
            cid: 'logoBentasca' // mismo cid que en el HTML
          }
        ]
      });

      res.json({ ok: true, reservaId: result.insertId });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
};
