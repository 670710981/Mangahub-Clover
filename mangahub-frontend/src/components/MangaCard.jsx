import { Link } from 'react-router-dom'
import Stars from './Stars.jsx'

export default function MangaCard({ manga, chapters, dark = false, className = '' }) {
  return (
    <Link to={`/manga/${manga.id}`} className={`block ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-slate-200">
        <img
          src={manga.cover}
          alt={manga.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span className="absolute right-1.5 top-1.5 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">
          {manga.type}
        </span>
      </div>

      <h3
        title={manga.title}
        className={`mt-2 line-clamp-2 min-h-10 text-sm font-medium ${
          dark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {manga.title}
      </h3>

      {chapters != null && <p className="text-xs text-slate-400">ตอนที่ {chapters}</p>}

      <div className="mt-1 flex items-center justify-between">
        <Stars score={manga.score} />
        <span className="text-xs text-slate-400">
          {manga.score != null ? manga.score.toFixed(1) : '-'}
        </span>
      </div>
    </Link>
  )
}
