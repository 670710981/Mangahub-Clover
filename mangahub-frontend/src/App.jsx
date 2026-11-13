import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Manga from './pages/Manga.jsx'
import MangaDetail from './pages/MangaDetail.jsx'
import About from './pages/About.jsx'
import ApiLab from './pages/ApiLab.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="manga" element={<Manga />} />
        <Route path="manga/:id" element={<MangaDetail />} />
        <Route path="about" element={<About />} />
        <Route path="api-lab" element={<ApiLab />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
