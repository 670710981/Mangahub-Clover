const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ดึงรายการมังงะทั้งหมด (รองรับค้นหา ?search= และกรองหมวดหมู่ ?genre=)
router.get('/mangas', async (req, res) => {
  const { search = '', genre = '' } = req.query;
  try {
    const result = await db.query(
      `SELECT m.*,
              COALESCE(ROUND(AVG(r.rating), 1), 0) AS avg_rating,
              COUNT(r.id)::int AS review_count
       FROM mangas m
       LEFT JOIN reviews r ON m.id = r.manga_id
       WHERE m.title ILIKE $1 AND m.genre ILIKE $2
       GROUP BY m.id
       ORDER BY m.id DESC`,
      [`%${search}%`, `%${genre}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'ดึงข้อมูลมังงะไม่สำเร็จ', error: err.message });
  }
});

// ดึงรายละเอียดมังงะรายเรื่อง
router.get('/mangas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM mangas WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบมังงะเรื่องนี้' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err.message });
  }
});

// เพิ่มมังงะใหม่
router.post('/mangas', async (req, res) => {
  const { title, author, genre, status, synopsis, cover_url } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO mangas (title, author, genre, status, synopsis, cover_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, author, genre, status || 'Ongoing', synopsis, cover_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'เพิ่มมังงะไม่สำเร็จ', error: err.message });
  }
});

module.exports = router;