/*
  server.js - entrypoint
*/
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db'); // tu db.js con pool
const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:4200', 'https://bentasca.com'],  // Tu frontend local y producción
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // en producción restringir origin a tu dominio

// ---------------------------
// Middleware de test DB
// ---------------------------
app.use(async (req, res, next) => {
  try {
    await db.query('SELECT 1'); // prueba de conexión
    next();
  } catch (err) {
    console.error('Error de conexión a DB, reintentando...', err);
    try {
      await db.query('SELECT 1'); // segundo intento
      next();
    } catch (err2) {
      console.error('Error de conexión persistente a DB:', err2);
      res.status(500).json({ error: 'DB no disponible, intente más tarde' });
    }
  }
});

// ---------------------------
// routes
// ---------------------------
const usuariosRoutes = require('./routes/usuarios');
const tablasRoutes = require('./routes/tablas');
const goleadoresRoutes = require('./routes/goleadores');
const eventosRoutes = require('./routes/eventos');

app.use('/usuarios', usuariosRoutes);
app.use('/tablas', tablasRoutes);
app.use('/goleadores', goleadoresRoutes);
app.use('/eventos', eventosRoutes);

// ruta raíz
app.get('/', (req, res) => res.send('Bentasca backend (bcryptjs)'));

// ---------------------------
// server listen
// ---------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// ---------------------------
// Keep-alive ping cada 5 minutos
// ---------------------------
setInterval(async () => {
  try {
    await db.query('SELECT 1');
    console.log('Ping DB exitoso');
  } catch (err) {
    console.error('Ping DB fallido:', err);
  }
}, 5 * 60 * 1000); // cada 5 minutos
