-- 1. ตารางผู้ใช้งาน
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user', -- 'user' หรือ 'admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตารางมังงะ
CREATE TABLE IF NOT EXISTS mangas (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(100),
  genre VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Ongoing', -- 'Ongoing', 'Completed'
  synopsis TEXT,
  cover_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตารางรีวิวและคะแนนดาว (1 user รีวิว 1 เรื่องได้ 1 ครั้ง)
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  manga_id INTEGER REFERENCES mangas(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (manga_id, user_id)
);

-- 4. ตารางชั้นหนังสือส่วนตัว (Bookmarks)
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  manga_id INTEGER REFERENCES mangas(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'Plan to Read', -- 'Reading', 'Completed', 'Plan to Read'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, manga_id)
);

-- ข้อมูลตัวอย่างสำหรับเทสต์หน้าเว็บ
INSERT INTO mangas (title, author, genre, status, synopsis, cover_url) VALUES
('Black Clover', 'Yūki Tabata', 'Fantasy, Action', 'Ongoing', 'เรื่องราวของอัสต้าเด็กหนุ่มผู้ไร้เวทมนตร์ในโลกที่เวทมนตร์คือทุกสิ่ง', 'https://placehold.co/300x420?text=Black+Clover'),
('Chainsaw Man', 'Tatsuki Fujimoto', 'Action, Dark Fantasy', 'Ongoing', 'เด็นจิเด็กหนุ่มนักล่าปีศาจที่รวมร่างกับปีศาจเลื่อยยนต์โปจิตะ', 'https://placehold.co/300x420?text=Chainsaw+Man'),
('Frieren: Beyond Journey''s End', 'Kanehito Yamada', 'Adventure, Fantasy', 'Ongoing', 'การเดินทางครั้งใหม่ของเอลฟ์จอมเวทหลังปราบจอมมารสำเร็จ', 'https://placehold.co/300x420?text=Frieren');