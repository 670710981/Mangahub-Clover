const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// 1. GET: ดึงรีวิวและคำนวณคะแนนเฉลี่ยของมังงะเรื่องนั้น
router.get('/manga/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;

    // ดึงรีวิวทั้งหมดพร้อมข้อมูล user
    const reviews = await db.query(
      `SELECT r.id, r.manga_id, r.rating, r.comment, r.created_at, u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.manga_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    // คำนวณคะแนนเฉลี่ย
    const avgRating = await db.query(
      `SELECT AVG(rating)::numeric(10,1) as average_rating, COUNT(id) as total_reviews
       FROM reviews
       WHERE manga_id = $1`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      data: {
        summary: avgRating.rows[0],
        reviews: reviews.rows
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch reviews' });
  }
});

// 2. POST: สร้างหรืออัปเดตรีวิว (ใช้ UPSERT ป้องกันรีวิวซ้ำ)
router.post('/manga/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ status: 'error', message: 'Rating must be between 1 and 10' });
    }

    const queryText = `
      INSERT INTO reviews (user_id, manga_id, rating, comment, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, manga_id) 
      DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await db.query(queryText, [userId, id, rating, comment]);

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to submit review' });
  }
});

module.exports = router;