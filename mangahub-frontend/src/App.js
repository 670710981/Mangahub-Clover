import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Mangas from './pages/Mangas';
import About from './pages/About';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />                {/* ← เห็นทุกหน้า */}
      <main className="flex-1">
        <Routes>                {/* ← เฉพาะตรงนี้ที่สลับตาม URL */}
          <Route path="/" element={<Home />} />
          <Route path="/mangas" element={<Mangas />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Footer />                {/* ← เห็นทุกหน้า */}
    </div>
  );
}

export default App;