const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// ข้อมูลจำลอง (Mock Data)
let favoritesMock = [
  { mangaId: '1', title: 'One Piece', imageUrl: 'https://cdn.myanimelist.net/images/manga/2/253146.jpg' },
  { mangaId: '2', title: 'Jujutsu Kaisen', imageUrl: 'https://cdn.myanimelist.net/images/manga/3/218042.jpg' }
];

// Routes
app.get('/', (req, res) => {
  res.status(200).send('MangaHub Backend API is running!');
});

app.get('/api/favorites', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: favoritesMock
  });
});

app.post('/api/favorites', (req, res) => {
  const { mangaId, title, imageUrl } = req.body;

  if (!mangaId || !title) {
    return res.status(400).json({ status: 'fail', message: 'mangaId and title are required' });
  }

  const newItem = { mangaId, title, imageUrl };
  favoritesMock.push(newItem);

  res.status(201).json({
    status: 'success',
    message: 'Added to favorites',
    data: newItem
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});