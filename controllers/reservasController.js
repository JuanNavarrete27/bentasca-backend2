// reservasController.js
const db = require('../db');
const { Resend } = require('resend');

// Inicializamos Resend (más simple y confiable que MailerSend)
const resend = new Resend(process.env.RESEND_API_KEY);

exports.crearReserva = async (req, res) => {
  try {
    const { nombre, telefono, email, fecha, hora, cancha, duracion = 1, tipo = 'F7', mensaje = '' } = req.body;

    // VALIDACIÓN BÁSICA
    if (!nombre || !telefono || !fecha || !hora) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Faltan datos obligatorios: nombre, teléfono, fecha u hora'
      });
    }

    // GUARDAR EN BASE DE DATOS
    const sql = `INSERT INTO reservas (nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      nombre.trim(),
      telefono.trim(),
      email?.trim() || null,
      fecha,
      hora,
      cancha?.trim() || 'Cancha principal',
      duracion,
      tipo,
      mensaje?.trim() || ''
    ];

    let result;
    try {
      [result] = await db.query(sql, values);
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          ok: false,
          mensaje: 'Horario no disponible. Ya hay una reserva para esa fecha y hora.'
        });
      }
      throw dbError;
    }

    const reservaId = result.insertId;

    // FORMATEAR FECHA BONITA PARA EL MAIL
    const fechaBonita = new Date(fecha).toLocaleDateString('es-UY', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, (c) => c.toUpperCase());

    // ENVÍO DE EMAILS CON RESEND (NUNCA FALLA)
    try {
      const htmlCliente = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0f0f0f; color: white; border: 4px solid #20c35a; border-radius: 20px; text-align: center;">
          <h1 style="color: #20c35a; font-size: 36px; margin-bottom: 20px;">RESERVA CONFIRMADA</h1>
          <h2 style="margin: 20px 0; color: white;">¡Hola ${nombre}!</h2>
          <div style="background: rgba(32,195,90,0.2); padding: 25px; border-radius: 16px; margin: 25px 0;">
            <p style="margin: 12px 0; font-size: 22px;"><strong>Fecha:</strong> ${fechaBonita}</p>
            <p style="margin: 12px 0; font-size: 28px; color: #20c35a;"><strong>Hora:</strong> ${hora}h</p>
            <p style="margin: 12px 0; font-size: 18px;"><strong>Cancha:</strong> ${cancha || 'Principal'}</p>
          </div>
          <p style="font-size: 20px; color: #20c35a;">¡Nos vemos en la cancha!</p>
          <p style="margin-top: 30px; color: #aaa; font-size: 14px;">Bentasca ⚽</p>
        </div>
      `;

      const htmlAdmin = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0f0f0f; color: white; border: 4px solid #20c35a; border-radius: 20px;">
          <h1 style="color: #20c35a; text-align: center;">NUEVA RESERVA</h1>
          <hr style="border: 1px solid #333; margin: 20px 0;">
          <p><strong>Cliente:</strong> ${nombre}</p>
          <p><strong>Teléfono:</strong> ${telefono}</p>
          <p><strong>Email:</strong> ${email || 'No proporcionado'}</p>
          <p><strong>Fecha:</strong> ${fechaBonita}</p>
          <p><strong>Hora:</strong> ${hora}h</p>
          <p><strong>Cancha:</strong> ${cancha || 'Principal'}</p>
          <p><strong>Duración:</strong> ${duracion}h</p>
          <p><strong>Mensaje:</strong> ${mensaje || 'Ninguno'}</p>
          <hr style="border: 1px solid #333; margin: 20px 0;">
          <p style="text-align: center; color: #20c35a; font-size: 18px;">Reserva ID: #${reservaId}</p>
        </div>
      `;

      // Mail al cliente (si tiene email)
      if (email && email.includes('@')) {
        await resend.emails.send({
          from: 'Bentasca Reservas <no-reply@bentasca.com>',
          to: [email.trim()],
          subject: '¡Tu reserva en Bentasca está confirmada!',
          html: htmlCliente
        });
        console.log('Mail enviado al cliente:', email);
      }

      // Mail al admin (si está configurado)
      if (process.env.MAILERSEND_ADMIN && process.env.MAILERSEND_ADMIN.includes('@')) {
        await resend.emails.send({
          from: 'Bentasca Reservas <no-reply@bentasca.com>',
          to: [process.env.MAILERSEND_ADMIN.trim()],
          subject: `Nueva reserva: ${nombre} - ${fechaBonita} ${hora}h`,
          html: htmlAdmin
        });
        console.log('Mail enviado al admin:', process.env.MAILERSEND_ADMIN);
      }

    } catch (emailError) {
      console.error("Error enviando emails (reserva OK):", emailError.message);
      // No rompemos nada si falla el mail
    }

    // RESPUESTA AL FRONTEND
    return res.json({
      ok: true,
      reservaId,
      mensaje: "Reserva creada con éxito"
    });

  } catch (error) {
    console.error("Error crítico en crearReserva:", error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor'
    });
  }
};
