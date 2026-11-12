const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// 1. GET: ดึงรายการมังงะโปรดทั้งหมดของผู้ใช้ที่ล็อกอินอยู่
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT id, manga_id, manga_title, cover_image, created_at 
       FROM favorites 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch favorites' });
  }
});

// 2. POST: เพิ่มมังงะเข้าในรายการโปรด
router.post('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { manga_id, manga_title, cover_image } = req.body;

    if (!manga_id || !manga_title) {
      return res.status(400).json({ status: 'error', message: 'Manga ID and Title are required' });
    }

    const result = await db.query(
      `INSERT INTO favorites (user_id, manga_id, manga_title, cover_image) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, manga_id) DO NOTHING 
       RETURNING *`,
      [userId, manga_id, manga_title, cover_image]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ status: 'error', message: 'Manga already in favorites' });
    }

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to add favorite' });
  }
});

// 3. DELETE: ลบมังงะออกจากรายการโปรด
router.delete('/favorites/:mangaId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mangaId } = req.params;

    const result = await db.query(
      `DELETE FROM favorites WHERE user_id = $1 AND manga_id = $2 RETURNING *`,
      [userId, mangaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Favorite item not found' });
    }

    res.status(200).json({ status: 'success', message: 'Removed from favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to remove favorite' });
  }
});

module.exports = router;