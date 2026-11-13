import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchAdminStats, fetchAdminUsers, fetchMangaPage } from '../lib/mangaApi.js'

const metricCards = [
  { key: 'mangas', label: 'มังงะในระบบ', accent: 'bg-emerald-50 text-emerald-700' },
  { key: 'users', label: 'สมาชิก', accent: 'bg-sky-50 text-sky-700' },
  { key: 'reviews', label: 'รีวิวทั้งหมด', accent: 'bg-amber-50 text-amber-700' },
]

export default function Admin() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ mangas: 0, users: 0, reviews: 0 })
  const [mangas, setMangas] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshDashboard = useCallback(async () => {
    setError('')
    try {
      const [nextStats, mangaPage, memberPage] = await Promise.all([
        fetchAdminStats(),
        fetchMangaPage({ page: 1, perPage: 10 }),
        fetchAdminUsers({ page: 1, perPage: 5 }),
      ])
      setStats(nextStats)
      setMangas(mangaPage.items)
      setMembers(memberPage.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') refreshDashboard()
  }, [user, refreshDashboard])

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">MangaHub</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">ภาพรวมและเครื่องมือนำเข้าข้อมูลมังงะ</p>
          </div>
           <div className="flex gap-2">
            
            <Link to="/admin/mangas" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
              จัดการมังงะ
            </Link>

            <Link
              to="/admin/users"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              จัดการสมาชิก
            </Link>
            
          <button type="button" onClick={refreshDashboard} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50">
              รีเฟรชข้อมูล
            </button>
          </div>
        </div>

        {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {metricCards.map((card) => (
            <section key={card.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${card.accent}`}>{card.label}</div>
              <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900">
                {loading ? '—' : Number(stats[card.key] || 0).toLocaleString('th-TH')}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">สมาชิกล่าสุด</h2>
                <p className="mt-1 text-sm text-slate-500">บัญชีที่สมัครเข้ามาล่าสุด</p>
              </div>
              <Link to="/admin/users" className="text-sm font-semibold text-emerald-700 hover:underline">จัดการสมาชิก</Link>
            </div>
            {loading ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">กำลังโหลด...</p>
            ) : members.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">ยังไม่มีสมาชิก</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {members.map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{member.username}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">{member.email || 'ไม่ระบุอีเมล'}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.role === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                        {member.role}
                      </span>
                      <p className="mt-2 text-xs text-slate-400">{member.created_at ? new Date(member.created_at).toLocaleDateString('th-TH') : ''}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">มังงะล่าสุด</h2>
                <p className="mt-1 text-sm text-slate-500">รายการที่อยู่ในฐานข้อมูล Supabase</p>
              </div>
              <Link to="/admin/mangas" className="text-sm font-semibold text-emerald-700 hover:underline">จัดการทั้งหมด</Link>
            </div>
            {loading ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">กำลังโหลด...</p>
            ) : mangas.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">ยังไม่มีข้อมูลมังงะ</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">ชื่อเรื่อง</th>
                      <th className="px-5 py-3 font-semibold">ประเภท</th>
                      <th className="px-5 py-3 text-right font-semibold">คะแนน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mangas.map((manga) => (
                      <tr key={manga.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5">
                          <Link to={`/manga/${manga.id}`} className="font-medium text-slate-800 hover:text-emerald-700">{manga.title}</Link>
                        </td>
                        <td className="max-w-[230px] truncate px-5 py-3.5 text-slate-500">{manga.genres.join(', ') || '—'}</td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-slate-600">{manga.score != null ? manga.score.toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}