const db = require('../db');
const nodemailer = require('nodemailer');

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

    // 🔥 USO CORRECTO: db.query()
    let result;
    try {
      const [insertResult] = await db.query(sql, values);
      result = insertResult;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          error: 'Ya hay una reserva para esa fecha, hora y cancha'
        });
      }
      throw err;
    }

    // ================================
    // 📩 CONFIGURACIÓN EMAIL
    // ================================
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const htmlEmail = `
      <div style="font-family: Arial; padding: 20px;">
        <img src="cid:logoBentasca" alt="logo" style="width:120px; margin-bottom:20px;" />
        <h2>Reserva confirmada</h2>

        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Hora:</strong> ${hora}</p>
        <p><strong>Cancha:</strong> ${cancha}</p>
        <p><strong>Duración:</strong> ${duracion} hora/s</p>

        ${mensaje ? `<p><strong>Mensaje:</strong> ${mensaje}</p>` : ""}

        <br>
        <p>Ubicación: <a href="https://maps.app.goo.gl/gx3WY1hgbot16C8f8">Google Maps</a></p>
        <hr>
        <p style="color:#555">Gracias por reservar en Bentasca ⚽</p>
      </div>
    `;

    // ================================
    // 📩 ENVÍO DE EMAIL AL CLIENTE
    // ================================
    if (email) {
      await transporter.sendMail({
        from: `"Bentasca" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Reserva confirmada ✔",
        html: htmlEmail,
        attachments: [
          {
            filename: "logo.png",
            path: "/mnt/data/logo.png",
            cid: "logoBentasca"
          }
        ]
      });
    }

    // ================================
    // 📩 ENVÍO DE EMAIL PARA EL ADMIN
    // ================================
    await transporter.sendMail({
      from: `"Bentasca" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_ADMIN,
      subject: "Nueva Reserva (Admin)",
      html: htmlEmail,
      attachments: [
        {
          filename: "logo.png",
          path: "/mnt/data/logo.png",
          cid: "logoBentasca"
        }
      ]
    });

    res.json({
      ok: true,
      reservaId: result.insertId
    });

  } catch (error) {
    console.error("Error en crearReserva:", error);
    res.status(500).json({ error: 'Error interno al crear la reserva' });
  }
};
