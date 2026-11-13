import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const MAX_SIZE = 8 * 1024 * 1024 // 8 MB
const AVATAR_PX = 256

const cardClass = 'rounded-2xl border border-slate-200 bg-white p-6'
const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'

// ย่อรูปเป็นสี่เหลี่ยมจัตุรัส 256px เพื่อให้เก็บใน localStorage ได้
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('ไฟล์นี้ไม่ใช่รูปภาพที่ใช้ได้'))
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_PX
        canvas.height = AVATAR_PX
        canvas
          .getContext('2d')
          .drawImage(
            img,
            (img.width - side) / 2,
            (img.height - side) / 2,
            side,
            side,
            0,
            0,
            AVATAR_PX,
            AVATAR_PX,
          )
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  const { user, changePassword, updateAvatar } = useAuth()
  const fileRef = useRef(null)
  const [avatarMsg, setAvatarMsg] = useState(null) // { type: 'error' | 'success', text }
  const [form, setForm] = useState({ current: '', next: '' })
  const [pwMsg, setPwMsg] = useState(null)

  if (!user) return <Navigate to="/login" replace />

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // ให้เลือกไฟล์เดิมซ้ำได้
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarMsg({ type: 'error', text: 'กรุณาเลือกไฟล์รูปภาพ' })
      return
    }
    if (file.size > MAX_SIZE) {
      setAvatarMsg({ type: 'error', text: 'รูปต้องมีขนาดไม่เกิน 8 MB' })
      return
    }

    try {
      const result = updateAvatar(await resizeImage(file))
      setAvatarMsg(
        result.ok
          ? { type: 'success', text: 'เปลี่ยนรูปโปรไฟล์แล้ว' }
          : { type: 'error', text: result.error },
      )
    } catch (err) {
      setAvatarMsg({ type: 'error', text: err.message })
    }
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = (e) => {
    e.preventDefault()
    if (!form.current || !form.next) {
      setPwMsg({ type: 'error', text: 'กรุณากรอกรหัสผ่านให้ครบ' })
      return
    }
    if (form.next.length < 8) {
      setPwMsg({ type: 'error', text: 'รหัสผ่านใหม่ต้องมี 8 ตัวขึ้นไป' })
      return
    }
    const result = changePassword(form)
    if (!result.ok) {
      setPwMsg({ type: 'error', text: result.error })
      return
    }
    setForm({ current: '', next: '' })
    setPwMsg({ type: 'success', text: 'เปลี่ยนรหัสผ่านแล้ว' })
  }

  const msgClass = (msg) => (msg.type === 'error' ? 'text-red-600' : 'text-emerald-600')

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10">
      {/* รูปโปรไฟล์ */}
      <section className={`${cardClass} flex items-center gap-5`}>
        <Avatar name={user.name} src={user.avatar} className="h-24 w-24 text-4xl" />
        <div>
          <h2 className="font-semibold text-slate-900">รูปโปรไฟล์</h2>
          <p className="mt-1 text-sm text-slate-500">เลือกรูปภาพขนาดไม่เกิน 8 MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            เลือกรูปโปรไฟล์
          </button>
          {avatarMsg && <p className={`mt-2 text-sm ${msgClass(avatarMsg)}`}>{avatarMsg.text}</p>}
        </div>
      </section>

      {/* ข้อมูลบัญชี */}
      <section className={`${cardClass} space-y-4`}>
        <div>
          <p className="text-sm text-slate-500">ชื่อที่แสดง</p>
          <p className="font-medium text-slate-900">{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">อีเมล</p>
          <p className="font-medium text-slate-900">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">ประเภทบัญชี</p>
          <p className="font-medium text-slate-900">member</p>
        </div>
      </section>

      {/* เปลี่ยนรหัสผ่าน */}
      <form onSubmit={onSubmit} noValidate>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">เปลี่ยนรหัสผ่าน</h2>
        <div className="space-y-3">
          <input
            name="current"
            type="password"
            autoComplete="current-password"
            value={form.current}
            onChange={onChange}
            placeholder="รหัสผ่านปัจจุบัน"
            className={inputClass}
          />
          <input
            name="next"
            type="password"
            autoComplete="new-password"
            value={form.next}
            onChange={onChange}
            placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
            className={inputClass}
          />
        </div>
        {pwMsg && <p className={`mt-3 text-sm ${msgClass(pwMsg)}`}>{pwMsg.text}</p>}
        <button
          type="submit"
          className="mt-3 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
        >
          บันทึกรหัสผ่านใหม่
        </button>
      </form>
    </div>
  )
}
