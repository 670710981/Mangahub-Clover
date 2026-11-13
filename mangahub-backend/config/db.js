const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // เพิ่มบรรทัดนี้: ถ้าอยู่บน Render (NODE_ENV=production) ให้เปิด SSL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('PostgreSQL Connected Successfully!');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};