import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-emerald-700'
  }`

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white">
      <nav className="flex h-full items-center gap-1 px-6">
        <Link to="/" className="mr-4 text-xl font-bold text-emerald-600">
          MangaHub
        </Link>

        <NavLink to="/" end className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/manga" className={linkClass}>
          Manga
        </NavLink>
        <NavLink to="/about" className={linkClass}>
          About
        </NavLink>

        <div className="ml-auto flex items-center gap-2">
          <NavLink to="/api-lab" className={linkClass}>
            API Lab
          </NavLink>
          {user ? (
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}