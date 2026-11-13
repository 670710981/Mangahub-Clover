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

    const session = { name: found.name, email: found.email, avatar: found.avatar }
    write(SESSION_KEY, session)
    setUser(session)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const changePassword = useCallback(
    ({ current, next }) => {
      if (!user) return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อน' }
      const users = read(USERS_KEY, [])
      const index = users.findIndex((u) => u.email === user.email)
      if (index === -1) return { ok: false, error: 'ไม่พบบัญชีผู้ใช้' }
      if (users[index].password !== current) {
        return { ok: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }
      }
      if (next.length < 8) return { ok: false, error: 'รหัสผ่านใหม่ต้องมี 8 ตัวขึ้นไป' }

      users[index] = { ...users[index], password: next }
      try {
        write(USERS_KEY, users)
      } catch {
        return { ok: false, error: 'บันทึกรหัสผ่านไม่สำเร็จ' }
      }
      return { ok: true }
    },
    [user],
  )

  // avatar เป็น data URL ของรูปที่ย่อแล้ว (ไม่ส่งค่า = ใช้ตัวอักษรแรกของชื่อ)
  const updateAvatar = useCallback(
    (avatar) => {
      if (!user) return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อน' }
      const users = read(USERS_KEY, [])
      const index = users.findIndex((u) => u.email === user.email)
      if (index === -1) return { ok: false, error: 'ไม่พบบัญชีผู้ใช้' }

      users[index] = { ...users[index], avatar }
      const session = { ...user, avatar }
      try {
        write(USERS_KEY, users)
        write(SESSION_KEY, session)
      } catch {
        return { ok: false, error: 'บันทึกรูปไม่สำเร็จ (พื้นที่เก็บข้อมูลของเบราว์เซอร์เต็ม)' }
      }
      setUser(session)
      return { ok: true }
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
