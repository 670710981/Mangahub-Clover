import { useEffect, useState } from 'react'
import MangaCard from '../components/MangaCard.jsx'
import { fetchMangaPage } from '../lib/anilist.js'

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Home() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    fetchMangaPage({ page: 1, perPage: 30 })
      .then(({ items }) => {
        if (cancelled) return
        // สุ่มลำดับมังงะ และสุ่มจำนวนตอนให้แต่ละเรื่อง
        setItems(
          shuffle(items).map((manga) => ({
            manga,
            chapters: 1 + Math.floor(Math.random() * 500),
          })),
        )
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
  }, [])

  return (
    <section className="bg-zinc-950 py-4">
      <h2 className="border-b border-zinc-800 px-6 pb-3 text-sm font-semibold text-white">
        มังงะยอดนิยม
      </h2>

      <div className="overflow-hidden pb-6 pt-5">
        {status === 'loading' && <p className="px-6 text-sm text-zinc-400">กำลังโหลด...</p>}
        {status === 'error' && (
          <p className="px-6 text-sm text-red-400">โหลดข้อมูลไม่สำเร็จ: {error}</p>
        )}
        {status === 'success' && (
          <div
            className="ml-6 flex w-max animate-marquee"
            style={{ animationDuration: `${items.length * 3}s` }}
          >
            {/* ซ้ำรายการ 2 ชุดเพื่อให้เลื่อนวนต่อเนื่องไม่สะดุด */}
            {[...items, ...items].map(({ manga, chapters }, i) => (
              <MangaCard
                key={`${manga.id}-${i}`}
                manga={manga}
                chapters={chapters}
                dark
                className="mr-4 w-44 shrink-0"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Home;