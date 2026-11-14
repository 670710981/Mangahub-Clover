import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
  e.preventDefault()
  if (!form.name.trim()) {
    setError('กรุณากรอกชื่อที่แสดง')
    return
  }
  if (!form.email.trim()) {
    setError('กรุณากรอกอีเมล')
    return
  }
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    setError('รูปแบบอีเมลไม่ถูกต้อง')
    return
  }
  if (form.password.length < 8) {
    setError('รหัสผ่านต้องมี 8 ตัวขึ้นไป')
    return
  }

  const result = await register(form)
  if (!result.ok) {
    setError(result.error)
    return
  }

  navigate('/')
}

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <form onSubmit={onSubmit} noValidate className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">สมัครสมาชิก</h1>

        <div className="space-y-3">
          <input
            name="name"
            type="text"
            autoComplete="nickname"
            value={form.name}
            onChange={onChange}
            placeholder="ชื่อที่แสดง"
            className={inputClass}
          />
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={onChange}
            placeholder="อีเมล"
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={onChange}
            placeholder="รหัสผ่าน (8 ตัวขึ้นไป)"
            className={inputClass}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="mt-3 w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-white hover:bg-emerald-600"
        >
          สมัครสมาชิก
        </button>

        <p className="mt-6 text-sm text-slate-600">
          มีบัญชีแล้ว?{' '}
          <Link to="/login" className="text-emerald-600 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </div>
  )
}

export default Register;