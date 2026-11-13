import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api'
const SESSION_KEY = 'mangahub:session'
const TOKEN_KEY = 'mangahub:token'

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function request(path, { method = 'GET', body, authenticated = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (authenticated) {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`)
  return data
}

function saveSession(data, setUser) {
  const account = {
    id: data.user.id,
    name: data.user.username,
    email: data.user.email,
    avatar: data.user.avatar_url,
    role: data.user.role,
  }
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(SESSION_KEY, JSON.stringify(account))
  setUser(account)
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  const register = useCallback(async ({ name, email, password }) => {
    try {
      const data = await request('/auth/register', {
        method: 'POST',
        body: { username: name.trim(), email: email.trim().toLowerCase(), password },
      })
      saveSession(data, setUser)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password },
      })
      saveSession(data, setUser)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const changePassword = useCallback(async ({ current, next }) => {
    try {
      await request('/auth/change-password', {
        method: 'PUT',
        authenticated: true,
        body: { currentPassword: current, newPassword: next },
      })
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }, [])

  // Avatar is stored in the browser until a profile-image endpoint is added.
  const updateAvatar = useCallback((avatar) => {
    const currentUser = readSession()
    if (!currentUser) return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อน' }
    const updatedUser = { ...currentUser, avatar }
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
      setUser(updatedUser)
      return { ok: true }
    } catch {
      return { ok: false, error: 'บันทึกรูปโปรไฟล์ไม่สำเร็จ' }
    }
  }, [])

  const value = useMemo(
    () => ({ user, register, login, logout, changePassword, updateAvatar }),
    [user, register, login, logout, changePassword, updateAvatar],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
