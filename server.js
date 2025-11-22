/*
  server.js — versión corregida para CORS en Render
*/
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

/* ============================================================
   CORS — ESTA ES LA CONFIGURACIÓN CORRECTA PARA RENDER + ANGULAR
   ============================================================ */
app.use(
  cors({
    origin: [
      'http://localhost:4200',
      'https://bentasca.com',
      'https://bentasca-backend2.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  })
);

// Necesario para permitir preflight requests CORS
app.options('*', cors());

/* ============================================================
   JSON PARSER (ANTES DE LAS RUTAS)
   ============================================================ */
app.use(express.json({ limit: '10mb' })); // necesario para fotos/avatars

/* ============================================================
   RUTAS — IMPORTANTE: VAN DESPUÉS DE CORS Y JSON
   ============================================================ */
app.use('/usuarios', require('./routes/usuarios'));
app.use('/tablas', require('./routes/tablas'));
app.use('/goleadores', require('./routes/goleadores'));
app.use('/eventos', require('./routes/eventos'));

app.get('/', (req, res) => res.send('Bentasca backend funcionando correctamente'));

/* ============================================================
   LEVANTAR SERVIDOR
   ============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

/* ============================================================
   KEEP ALIVE DB — SOLO EN PRODUCCIÓN
   ============================================================ */
setInterval(() => {
  db.query('SELECT 1').catch(err =>
    console.error('Ping DB fallido:', err)
  );
}, 5 * 60 * 1000);
