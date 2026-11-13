import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from './Avatar.jsx'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-emerald-700'
  }`

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // ปิดเมนูเมื่อคลิกนอกเมนู หรือกด Esc
  useEffect(() => {
    if (!open) return undefined

    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

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
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <Avatar name={user.name} src={user.avatar} />
                <span className="text-sm font-semibold text-slate-800">Hi, {user.name}</span>
                <span className="text-xs text-slate-500">{open ? '▲' : '▼'}</span>
              </button>

              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                >
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false)
                      logout()
                      navigate('/')
                    }}
                    className="block w-full border-t border-slate-200 px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-slate-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
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
