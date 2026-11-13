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

async function sendRequest(path, { method = 'POST', body, authenticated = false } = {}) {
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

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`)
  }

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
      const data = await sendRequest('/auth/register', {
        body: {
          username: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
      })

      saveSession(data, setUser)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    try {
      const data = await sendRequest('/auth/login', {
        body: {
          email: email.trim().toLowerCase(),
          password,
        },
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
      await sendRequest('/auth/change-password', {
        method: 'PUT',
        authenticated: true,
        body: {
          currentPassword: current,
          newPassword: next,
        },
      })
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }, [])

  // Avatar ยังบันทึกไว้ในเบราว์เซอร์ ยังไม่ได้ส่งไปเก็บในฐานข้อมูล
  const updateAvatar = useCallback(
    (avatar) => {
      if (!user) return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อน' }

      const updatedUser = { ...user, avatar }

      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
        setUser(updatedUser)
        return { ok: true }
      } catch {
        return { ok: false, error: 'บันทึกรูปไม่สำเร็จ' }
      }
    },
    [user],
  )

  const value = useMemo(
    () => ({ user, register, login, logout, changePassword, updateAvatar }),
    [user, register, login, logout, changePassword, updateAvatar],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}