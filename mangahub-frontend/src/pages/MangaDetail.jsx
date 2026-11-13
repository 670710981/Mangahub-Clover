import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import HeartIcon from '../components/HeartIcon.jsx'
import Stars from '../components/Stars.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  addFavorite,
  fetchFavorites,
  fetchMangaById,
  fetchReviews,
  removeFavorite,
  submitReview,
} from '../lib/mangaApi.js'

export default function MangaDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [manga, setManga] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [favorite, setFavorite] = useState(false)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [favoriteMessage, setFavoriteMessage] = useState('')
  const [reviewData, setReviewData] = useState({ summary: { average_rating: 0, total_reviews: 0 }, reviews: [] })
  const [reviewError, setReviewError] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [rating, setRating] = useState(8)
  const [comment, setComment] = useState('')

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
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setStatus('error')
        }
      })

    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    let cancelled = false
    setReviewError('')
    fetchReviews(id)
      .then((data) => { if (!cancelled) setReviewData(data) })
      .catch((err) => { if (!cancelled) setReviewError(err.message) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setFavorite(false)
      return () => { cancelled = true }
    }
    fetchFavorites()
      .then((items) => { if (!cancelled) setFavorite(items.some((item) => String(item.id) === String(id))) })
      .catch(() => { if (!cancelled) setFavorite(false) })
    return () => { cancelled = true }
  }, [id, user])

  async function toggleFavorite() {
    if (!manga || favoriteBusy) return
    setFavoriteBusy(true)
    setFavoriteMessage('')
    try {
      if (favorite) {
        await removeFavorite(manga.id)
        setFavorite(false)
        setFavoriteMessage('นำออกจากรายการโปรดแล้ว')
      } else {
        await addFavorite(manga)
        setFavorite(true)
        setFavoriteMessage('เพิ่มในรายการโปรดแล้ว')
      }
    } catch (err) {
      setFavoriteMessage(err.message)
    } finally {
      setFavoriteBusy(false)
    }
  }

  async function onSubmitReview(event) {
    event.preventDefault()
    if (comment.trim().length < 10) {
      setReviewMessage('เขียนความเห็นอย่างน้อย 10 ตัวอักษร')
      return
    }
    setReviewBusy(true)
    setReviewMessage('')
    try {
      await submitReview(id, { rating, comment: comment.trim() })
      setReviewData(await fetchReviews(id))
      setComment('')
      setReviewMessage('รีวิวของคุณถูกบันทึกแล้ว')
    } catch (err) {
      setReviewMessage(err.message)
    } finally {
      setReviewBusy(false)
    }
  }

  if (status === 'loading') {
    return <p className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500">กำลังโหลด...</p>
  }

  if (status === 'error') {
    return <p className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-600">โหลดข้อมูลไม่สำเร็จ: {error}</p>
  }

  const reviews = reviewData.reviews || []
  const summary = reviewData.summary || { average_rating: 0, total_reviews: 0 }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 md:grid-cols-[260px_1fr]">
        <div className="mx-auto w-full max-w-[260px]">
          {manga.cover ? (
            <img src={manga.cover} alt={manga.title} className="aspect-[2/3] w-full rounded-2xl bg-slate-100 object-cover shadow-md" />
          ) : (
            <div className="grid aspect-[2/3] place-items-center rounded-2xl bg-slate-100 text-slate-400">ไม่มีภาพปก</div>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-start">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">{manga.type}</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{manga.title}</h1>
          <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">{manga.description || 'ไม่มีเรื่องย่อ'}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-600">
            <span><strong className="text-slate-800">จำนวนตอน:</strong> {manga.chapters != null ? `${manga.chapters} ตอน` : 'ไม่ระบุ'}</span>
            <span className="flex items-center gap-2"><Stars score={manga.score} /><strong className="text-slate-800">{manga.score != null ? manga.score.toFixed(1) : '-'}</strong></span>
          </div>

          {manga.genres?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {manga.genres.map((genre) => <span key={genre} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{genre}</span>)}
            </div>
          )}

          <div className="mt-7 flex flex-col items-start gap-2">
            {user ? (
              <button
                type="button"
                onClick={toggleFavorite}
                disabled={favoriteBusy}
                aria-pressed={favorite}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${favorite ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                <HeartIcon filled={favorite} />
                {favorite ? 'อยู่ในรายการโปรด' : 'เพิ่มรายการโปรด'}
              </button>
            ) : (
              <p className="text-sm text-slate-600"><Link to="/login" className="font-semibold text-emerald-700 underline">เข้าสู่ระบบ</Link> เพื่อเพิ่มรายการโปรด</p>
            )}
            {favoriteMessage && <p className="text-sm text-slate-500">{favoriteMessage}</p>}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Community</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">รีวิวจากชุมชน</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{summary.average_rating ? Number(summary.average_rating).toFixed(1) : '—'}<span className="ml-1 text-sm font-medium text-slate-400">/ 10</span></p>
            <p className="text-sm text-slate-500">{summary.total_reviews} รีวิว</p>
          </div>
        </div>

        {reviewError && <p className="mt-4 text-sm text-red-600">โหลดรีวิวไม่สำเร็จ: {reviewError}</p>}
        {reviews.length === 0 && <p className="py-6 text-sm text-slate-500">ยังไม่มีรีวิว มาแบ่งปันความเห็นเป็นคนแรกได้เลย</p>}
        {reviews.length > 0 && (
          <div className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <article key={review.id} className="flex gap-3 py-5">
                <Avatar name={review.username} src={review.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800">{review.username}</p>
                    <time className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('th-TH')}</time>
                  </div>
                  <p className="mt-1 text-sm font-medium text-amber-600">คะแนน {review.rating}/10</p>
                  <p className="mt-2 whitespace-pre-line leading-6 text-slate-600">{review.comment}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        <form onSubmit={onSubmitReview} className="mt-5 rounded-2xl bg-slate-50 p-4 sm:p-6">
          <h3 className="font-semibold text-slate-900">เขียนรีวิว {manga.title}</h3>
          {user ? (
            <>
              <fieldset className="mt-4">
                <legend className="mb-2 text-sm font-medium text-slate-700">ให้คะแนนเรื่องนี้</legend>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                    <button key={value} type="button" onClick={() => setRating(value)} aria-pressed={rating === value} className={`h-9 w-9 rounded-xl text-sm font-semibold transition ${rating === value ? 'bg-emerald-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}>
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="review-comment" className="mt-4 block text-sm font-medium text-slate-700">ความเห็นของคุณ</label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="เล่าให้ฟังว่าคุณรู้สึกอย่างไรกับเรื่องนี้..."
                className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-400">อย่างน้อย 10 ตัวอักษร · {comment.length}/2000</p>
                <button type="submit" disabled={reviewBusy} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                  {reviewBusy ? 'กำลังส่ง...' : 'ส่งรีวิว'}
                </button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-600"><Link to="/login" className="font-semibold text-emerald-700 underline">เข้าสู่ระบบ</Link> เพื่อเขียนรีวิว</p>
          )}
          {reviewMessage && <p className="mt-3 text-sm text-emerald-700">{reviewMessage}</p>}
        </form>
      </section>
    </div>
  )
}
