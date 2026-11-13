import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchFavorites, removeFavorite } from '../lib/mangaApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import HeartIcon from '../components/HeartIcon.jsx'

export default function Favorites() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setItems([])
      setStatus('signed-out')
      return
    }
    setStatus('loading')
    setError('')
    try {
      setItems(await fetchFavorites())
      setStatus('success')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [user])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return items
    return items.filter((item) => item.title.toLocaleLowerCase().includes(normalized))
  }, [items, query])

  async function onRemove(id) {
    try {
      await removeFavorite(id)
      setItems((current) => current.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-4 py-12 sm:px-6">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500">
          <HeartIcon filled className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">รายการโปรด</h1>
        <p className="mt-2 text-sm text-slate-500">รวมเรื่องที่คุณอยากกลับมาอ่านอีกครั้ง</p>
        <label htmlFor="favorite-search" className="sr-only">
          ค้นหารายการโปรด
        </label>
        <input
          id="favorite-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหารายการโปรด..."
          className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      {status === 'loading' && <p className="py-10 text-center text-slate-500">กำลังโหลดรายการโปรด...</p>}
      {status === 'error' && <p className="py-6 text-center text-red-600">โหลดรายการโปรดไม่สำเร็จ: {error}</p>}
      {status === 'signed-out' && (
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="font-semibold text-slate-800">เข้าสู่ระบบเพื่อดูรายการโปรด</p>
          <Link to="/login" className="mt-4 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700">
            เข้าสู่ระบบ
          </Link>
        </div>
      )}
      {status === 'success' && items.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
            <HeartIcon className="h-8 w-8" />
          </div>
          <p className="text-lg font-semibold text-slate-700">คุณยังไม่มีรายการโปรด</p>
          <p className="mt-2 text-sm text-slate-500">กดสัญลักษณ์หัวใจบนหน้ารายละเอียดเพื่อบันทึกเรื่องที่ชอบ</p>
        </div>
      )}
      {status === 'success' && items.length > 0 && filteredItems.length === 0 && (
        <p className="py-12 text-center text-slate-500">ไม่พบรายการที่ตรงกับ “{query}”</p>
      )}
      {status === 'success' && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredItems.map((item) => (
            <article key={item.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <Link to={`/manga/${item.id}`} className="block">
                <div className="aspect-[2/3] overflow-hidden rounded-xl bg-slate-100">
                  {item.cover ? <img src={item.cover} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-sm text-slate-400">ไม่มีภาพปก</div>}
                </div>
                <h2 className="line-clamp-2 min-h-11 px-1 pt-3 text-sm font-semibold text-slate-800">{item.title}</h2>
              </Link>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`นำ ${item.title} ออกจากรายการโปรด`}
                title="นำออกจากรายการโปรด"
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-rose-500 shadow-md transition hover:scale-105 hover:bg-rose-50"
              >
                <HeartIcon filled />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
