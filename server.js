/*
  server.js
*/
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

app.use(express.json());

app.use(cors({
  origin: ['http://localhost:4200', 'https://bentasca.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ping de conexión a DB (opcional pero útil en servidores free)
app.use(async (req, res, next) => {
  try {
    await db.query('SELECT 1');
    next();
  } catch (err) {
    console.error('Error de DB:', err);
    res.status(500).json({ error: 'DB no disponible' });
  }
});

// Rutas
app.use('/usuarios', require('./routes/usuarios'));
app.use('/tablas', require('./routes/tablas'));
app.use('/goleadores', require('./routes/goleadores'));
app.use('/eventos', require('./routes/eventos'));

app.get('/', (req, res) => res.send('Bentasca backend (bcryptjs)'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// Keep-alive DB ping
setInterval(() => {
  db.query('SELECT 1').catch(err => console.error('Ping DB fallido:', err));
}, 5 * 60 * 1000);
