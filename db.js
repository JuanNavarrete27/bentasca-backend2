/*
  db.js - mysql2 pool connection
*/
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST || 'b99rg5klb9i5qhzdwcy4-mysql.services.clever-cloud.com',
  user: process.env.MYSQL_ADDON_USER || 'uanhygqsgszwryv8',
  password: process.env.MYSQL_ADDON_PASSWORD || 'vpP9Puizq27MwNCL7PrZ',
  database: process.env.MYSQL_ADDON_DB || 'b99rg5klb9i5qhzdwcy4',
  port: process.env.MYSQL_ADDON_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 4,
  queueLimit: 0
}).promise();

module.exports = pool;
