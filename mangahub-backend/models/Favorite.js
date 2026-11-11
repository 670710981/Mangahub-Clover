const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  mangaId: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  imageUrl: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Favorite', favoriteSchema);