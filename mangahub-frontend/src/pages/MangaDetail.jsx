import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Stars from '../components/Stars.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchMangaById } from '../lib/anilist.js'

export default function MangaDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [manga, setManga] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError('')

    fetchMangaById(id)
      .then((data) => {
        if (cancelled) return
        setManga(data)
        setStatus('success')
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (status === 'loading') {
    return <p className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500">กำลังโหลด...</p>
  }

  if (status === 'error') {
    return (
      <p className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-600">
        โหลดข้อมูลไม่สำเร็จ: {error}
      </p>
    )
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row">
      {/* ซ้าย: หน้าปก */}
      <div className="w-full shrink-0 md:w-64">
        <img
          src={manga.cover}
          alt={manga.title}
          className="w-full rounded-lg bg-slate-200 object-cover shadow"
        />
      </div>

      {/* ขวา: ชื่อ เรื่องย่อ จำนวนตอน เรตติ้ง รายการโปรด */}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold text-slate-900">{manga.title}</h1>

        <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-600">
          {manga.description || 'ไม่มีเรื่องย่อ'}
        </p>

        <p className="mt-6 text-slate-700">
          <span className="font-medium">จำนวนตอนทั้งหมด:</span>{' '}
          {manga.chapters != null ? `${manga.chapters} ตอน` : 'ไม่ระบุ'}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Stars score={manga.score} />
          <span className="text-sm text-slate-500">
            {manga.score != null ? manga.score.toFixed(1) : '-'}
          </span>
        </div>

        <div className="mt-6">
          {user ? (
            <button
              type="button"
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
            >
              เพิ่มในรายการโปรด
            </button>
          ) : (
            <p className="text-slate-700">
              <Link to="/login" className="text-blue-600 underline decoration-blue-600">
                เข้าสู่ระบบ
              </Link>{' '}
              เพื่อเพิ่มรายการโปรด
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
