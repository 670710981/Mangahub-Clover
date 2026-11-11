// models/Favorite.js (ตัวอย่าง MongoDB/Mongoose)
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mangaId: { type: String, required: true }, // ID จาก Jikan API หรือ MangaDex
  title: { type: String, required: true },
  imageUrl: { type: String },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Favorite', favoriteSchema);