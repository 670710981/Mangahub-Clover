const db = require('./config/db');

async function setupUsersTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        anilist_id INTEGER UNIQUE,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ สร้างตาราง users เรียบร้อยแล้ว!');
    process.exit(0);
  } catch (err) {
    console.error('❌ สร้างไม่สำเร็จ:', err.message);
    process.exit(1);
  }
}

setupUsersTable();