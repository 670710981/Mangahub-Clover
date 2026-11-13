import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { deleteManga, fetchMangaPage, updateManga } from '../lib/mangaApi.js'

const blankForm = {
  id: null,
  title: '',
  author: '',
  genres: '',
  status: '',
  description: '',
  cover: '',
  score: '',
  chapters: '',
}

export default function AdminMangas() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankForm)

  const loadMangas = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchMangaPage({ page, perPage: 30, search })
      setItems(result.items)
      setHasNext(result.hasNext)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    if (user?.role === 'admin') loadMangas()
  }, [user, loadMangas])

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  function beginEdit(manga) {
    setForm({
      id: manga.id,
      title: manga.title || '',
      author: manga.author || '',
      genres: manga.genres.join(', '),
      status: manga.status || '',
      description: manga.description || '',
      cover: manga.cover || '',
      score: manga.score ?? '',
      chapters: manga.chapters ?? '',
    })
    setEditing(manga)
    setError('')
    setNotice('')
  }

  async function onSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateManga({
        ...form,
        score: form.score === '' ? null : Number(form.score),
        chapters: form.chapters === '' ? null : Number(form.chapters),
      })
      setEditing(null)
      setNotice(`บันทึกการแก้ไข “${form.title}” แล้ว`)
      await loadMangas()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(manga) {
    const confirmed = window.confirm(`ลบ “${manga.title}” หรือไม่? รีวิวและรายการโปรดของเรื่องนี้จะถูกลบด้วย`)
    if (!confirmed) return
    setError('')
    setNotice('')
    try {
      await deleteManga(manga.id)
      setNotice(`ลบ “${manga.title}” แล้ว`)
      await loadMangas()
    } catch (err) {
      setError(err.message)
    }
  }

  function onSearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/admin" className="text-sm font-semibold text-emerald-700 hover:underline">← กลับหน้า Admin</Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">จัดการมังงะ</h1>
            <p className="mt-2 text-sm text-slate-500">ค้นหา แก้ไข หรือลบรายการในคลัง Supabase</p>
          </div>
          <form onSubmit={onSearch} className="flex w-full gap-2 sm:w-auto">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ค้นหาชื่อมังงะ..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:w-72"
            />
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">ค้นหา</button>
          </form>
        </div>

        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-medium text-slate-700">หน้า {page} · แสดง {items.length} รายการ</p>
            <button type="button" onClick={loadMangas} disabled={loading} className="text-sm font-semibold text-emerald-700 hover:underline disabled:opacity-50">รีเฟรชรายการ</button>
          </div>
          {loading ? (
            <p className="px-6 py-14 text-center text-sm text-slate-500">กำลังโหลดรายการมังงะ...</p>
          ) : items.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-slate-500">ไม่พบมังงะที่ค้นหา</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">มังงะ</th>
                    <th className="px-5 py-3 font-semibold">ประเภท / สถานะ</th>
                    <th className="px-5 py-3 text-center font-semibold">รีวิว</th>
                    <th className="px-5 py-3 text-right font-semibold">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((manga) => (
                    <tr key={manga.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          {manga.cover ? <img src={manga.cover} alt="" className="h-16 w-11 shrink-0 rounded-lg bg-slate-100 object-cover" /> : <div className="h-16 w-11 shrink-0 rounded-lg bg-slate-100" />}
                          <div className="min-w-0">
                            <Link to={`/manga/${manga.id}`} className="line-clamp-2 font-semibold text-slate-800 hover:text-emerald-700">{manga.title}</Link>
                            <p className="mt-1 text-xs text-slate-400">AniList ID: {manga.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[280px] px-5 py-3.5">
                        <p className="line-clamp-2 text-slate-600">{manga.genres.join(', ') || 'ไม่ระบุประเภท'}</p>
                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">{manga.status || 'ไม่ระบุสถานะ'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center tabular-nums text-slate-600">{manga.reviewCount}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => beginEdit(manga)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700">แก้ไข</button>
                          <button type="button" onClick={() => onDelete(manga)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || loading} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">ก่อนหน้า</button>
            <span className="text-xs text-slate-400">หน้า {page}</span>
            <button type="button" onClick={() => setPage((current) => current + 1)} disabled={!hasNext || loading} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">ถัดไป</button>
          </div>
        </section>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditing(null) }}>
          <form onSubmit={onSave} className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">แก้ไขข้อมูลมังงะ</h2>
                <p className="mt-1 text-sm text-slate-500">AniList ID: {editing.id}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} disabled={saving} aria-label="ปิดหน้าต่าง" className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100">×</button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">ชื่อเรื่อง</span>
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">ผู้แต่ง</span>
                <input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">สถานะ</span>
                <input value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} placeholder="releasing / finished" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">ประเภท (คั่นด้วย comma)</span>
                <input value={form.genres} onChange={(event) => setForm({ ...form, genres: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">คะแนน / 10</span>
                <input type="number" min="0" max="10" step="0.1" value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">จำนวนตอน</span>
                <input type="number" min="0" value={form.chapters} onChange={(event) => setForm({ ...form, chapters: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">URL ภาพปก</span>
                <input type="url" value={form.cover} onChange={(event) => setForm({ ...form, cover: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">เรื่องย่อ</span>
                <textarea rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setEditing(null)} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">ยกเลิก</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}