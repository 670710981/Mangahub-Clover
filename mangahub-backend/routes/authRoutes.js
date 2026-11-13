const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// ฟังก์ชันช่วยสร้าง JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || 'supersecretkey123',
    { expiresIn: '7d' }
  );
};

// 1. POST: Login ผ่าน AniList OAuth2 (รับ authorization code จาก Frontend)
router.post('/auth/anilist', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ status: 'error', message: 'Authorization code is required' });
    }

    // 1.1 นำ code ไปแลก Access Token กับ AniList
    const tokenRes = await axios.post('https://anilist.co/api/v2/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.ANILIST_CLIENT_ID,
      client_secret: process.env.ANILIST_CLIENT_SECRET,
      redirect_uri: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`,
      code,
    });

    const accessToken = tokenRes.data.access_token;

    // 1.2 ดึงข้อมูลโปรไฟล์ User จาก AniList GraphQL API
    const viewerQuery = `query { Viewer { id name avatar { large } } }`;
    const userRes = await axios.post(
      'https://graphql.anilist.co',
      { query: viewerQuery },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const anilistUser = userRes.data.data.Viewer;

    // 1.3 บันทึกหรืออัปเดตข้อมูล User ลง PostgreSQL
    const dbRes = await db.query(
      `INSERT INTO users (anilist_id, username, avatar_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (anilist_id) 
       DO UPDATE SET username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url
       RETURNING id, anilist_id, username, avatar_url`,
      [anilistUser.id, anilistUser.name, anilistUser.avatar.large]
    );

    const user = dbRes.rows[0];
    const token = generateToken(user);

    res.status(200).json({ status: 'success', token, user });
  } catch (err) {
    console.error('AniList OAuth Error:', err.response?.data || err.message);
    res.status(401).json({ status: 'error', message: 'AniList authentication failed' });
  }
});

// 2. POST: Dev Login (สำหรับทดสอบระบบโดยไม่ต้องต่อ AniList จริง)
router.post('/auth/dev-login', async (req, res) => {
  try {
    const { username = 'testuser', email = 'test@mangahub.com' } = req.body;

    const dbRes = await db.query(
      `INSERT INTO users (username, email, avatar_url)
       VALUES ($1, $2, 'https://via.placeholder.com/150')
       ON CONFLICT (email) 
       DO UPDATE SET username = EXCLUDED.username
       RETURNING id, username, email, avatar_url`,
      [username, email]
    );

    const user = dbRes.rows[0];
    const token = generateToken(user);

    res.status(200).json({ status: 'success', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Dev login failed' });
  }
});

// 3. GET: ดึงข้อมูลโปรไฟล์ตัวเอง (เช็กสถานะ Token)
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const dbRes = await db.query(
      'SELECT id, anilist_id, username, email, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (dbRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.status(200).json({ status: 'success', user: dbRes.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

module.exports = router;