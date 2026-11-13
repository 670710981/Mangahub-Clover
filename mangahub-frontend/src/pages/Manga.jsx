import { useEffect, useMemo, useRef, useState } from 'react'
import MangaCard from '../components/MangaCard.jsx'
import { fetchGenres, fetchMangaPage } from '../lib/anilist.js'

// เรียง a-z ก่อน แล้วตามด้วย ก-ฮ
const collator = new Intl.Collator(['en', 'th'])

function Manga() {
  const [genres, setGenres] = useState([])
  const [genre, setGenre] = useState(null) // null = มังงะทั้งหมด
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const requestId = useRef(0)

  const sortedGenres = useMemo(() => [...genres].sort(collator.compare), [genres])

  useEffect(() => {
    fetchGenres()
      .then(setGenres)
      .catch(() => {})
  }, [])

  // หน่วงการค้นหาเล็กน้อยระหว่างพิมพ์
  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 400)
    return () => clearTimeout(t)
  }, [input])

  useEffect(() => {
    const id = ++requestId.current
    setStatus('loading')
    setError('')

    fetchMangaPage({ page: 1, perPage: 30, search, genre })
      .then(({ items, hasNext }) => {
        if (id !== requestId.current) return
        setItems(items)
        setPage(1)
        setHasNext(hasNext)
        setStatus('success')
      })
      .catch((e) => {
        if (id !== requestId.current) return
        setError(e.message)
        setStatus('error')
      })
  }, [genre, search])

  async function loadMore() {
    const id = requestId.current
    setLoadingMore(true)
    try {
      const next = await fetchMangaPage({ page: page + 1, perPage: 30, search, genre })
      if (id !== requestId.current) return
      setItems((prev) => {
        const seen = new Set(prev.map((m) => m.id))
        return [...prev, ...next.items.filter((m) => !seen.has(m.id))]
      })
      setPage(page + 1)
      setHasNext(next.hasNext)
    } catch (e) {
      if (id === requestId.current) setError(e.message)
    } finally {
      setLoadingMore(false)
    }
  }

  const menuItem = (active) =>
    `block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
      active ? 'bg-emerald-500 font-medium text-white' : 'text-slate-700 hover:bg-emerald-50'
    }`

  return (
    <div className="flex items-start">
      {/* ซ้าย: เมนูประเภทมังงะ */}
      <aside className="sticky top-16 z-10 h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
        <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          ประเภทมังงะ
        </h2>
        <ul className="space-y-1">
          <li>
            <button type="button" onClick={() => setGenre(null)} className={menuItem(genre === null)}>
              มังงะทั้งหมด
            </button>
          </li>
          {sortedGenres.map((g) => (
            <li key={g}>
              <button type="button" onClick={() => setGenre(g)} className={menuItem(genre === g)}>
                {g}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* กลาง: รายการมังงะ */}
      <section className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 p-6">
        {error && <p className="mb-4 text-sm text-red-600">โหลดข้อมูลไม่สำเร็จ: {error}</p>}
        {status === 'loading' && <p className="text-sm text-slate-500">กำลังโหลด...</p>}
        {status === 'success' && items.length === 0 && (
          <p className="text-sm text-slate-500">ไม่พบมังงะ</p>
        )}

        {status === 'success' && items.length > 0 && (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
              {items.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>

            {hasNext && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                >
                  {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่ม'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ขวาสุด: ช่องค้นหา (พื้นหลังทึบ มังงะไม่ทะลุออกมา) */}
      <aside className="sticky top-16 z-10 h-[calc(100vh-4rem)] w-72 shrink-0 border-l border-slate-200 bg-white p-4">
        <label htmlFor="manga-search" className="mb-2 block text-sm font-medium text-slate-700">
          ค้นหามังงะ
        </label>
        <input
          id="manga-search"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ชื่อมังงะ"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </aside>
    </div>
  )
}


export default Manga;