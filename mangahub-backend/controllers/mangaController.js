// controllers/mangaController.js
const Favorite = require('../models/Favorite');

// ดึงรายการมังงะโปรดของผู้ใช้
exports.getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id });
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// เพิ่มมังงะเข้า รายการโปรด
exports.addFavorite = async (req, res) => {
  const { mangaId, title, imageUrl } = req.body;
  try {
    const newFav = new Favorite({
      userId: req.user.id,
      mangaId,
      title,
      imageUrl
    });
    await newFav.save();
    res.status(201).json({ message: 'Added to favorites', data: newFav });
  } catch (error) {
    res.status(400).json({ message: 'Failed to add favorite', error: error.message });
  }
};