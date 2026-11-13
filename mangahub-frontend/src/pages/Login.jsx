import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
  e.preventDefault()
  if (!form.email.trim() || !form.password) {
    setError('กรุณากรอกอีเมลและรหัสผ่าน')
    return
  }

  const result = await login(form)
  if (!result.ok) {
    setError(result.error)
    return
  }

  navigate('/')
}

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <form onSubmit={onSubmit} noValidate className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">เข้าสู่ระบบ</h1>

        <div className="space-y-3">
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
            autoComplete="current-password"
            value={form.password}
            onChange={onChange}
            placeholder="รหัสผ่าน"
            className={inputClass}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="mt-3 w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-white hover:bg-emerald-600"
        >
          เข้าสู่ระบบ
        </button>

        <p className="mt-6 text-sm text-slate-600">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-emerald-600 hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </form>
    </div>
  )
}

export default Login;