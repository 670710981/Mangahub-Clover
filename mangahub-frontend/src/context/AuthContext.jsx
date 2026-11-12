import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const USERS_KEY = 'mangahub:users'
const SESSION_KEY = 'mangahub:session'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const AuthContext = createContext(null)

// prototype ฝั่ง client อย่างเดียว: เก็บบัญชีใน localStorage (ยังไม่มี Backend)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => read(SESSION_KEY, null))

  const register = useCallback(({ name, email, password }) => {
    const users = read(USERS_KEY, [])
    const normalized = email.trim().toLowerCase()
    if (users.some((u) => u.email === normalized)) {
      return { ok: false, error: 'อีเมลนี้ถูกใช้สมัครแล้ว' }
    }
    users.push({ name: name.trim(), email: normalized, password })
    write(USERS_KEY, users)

    const session = { name: name.trim(), email: normalized }
    write(SESSION_KEY, session)
    setUser(session)
    return { ok: true }
  }, [])

  const login = useCallback(({ email, password }) => {
    const users = read(USERS_KEY, [])
    const normalized = email.trim().toLowerCase()
    const found = users.find((u) => u.email === normalized && u.password === password)
    if (!found) return { ok: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }

    const session = { name: found.name, email: found.email }
    write(SESSION_KEY, session)
    setUser(session)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, register, login, logout }), [user, register, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
