const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api'
const TOKEN_KEY = 'mangahub:token'

async function request(path, { method = 'GET', body, authenticated = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (authenticated) {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`)
  return data
}

function mapManga(m) {
  const genres = typeof m.genre === 'string' ? m.genre.split(',').map((g) => g.trim()).filter(Boolean) : []
  return {
    id: m.anilist_id || m.id,
    title: m.title,
    cover: m.cover_url || '',
    score: m.score ?? null,
    type: 'MANGA',
    genres,
    description: m.synopsis || '',
    chapters: m.chapters ?? null,
  }
}

export async function fetchMangaPage({ page = 1, perPage = 30, search = '', genre = '' } = {}) {
  const params = new URLSearchParams({ page, perPage, search, genre: genre || '' })
  const result = await request(`/mangas?${params}`)
  return { items: result.items.map(mapManga), hasNext: result.has_next }
}

export async function fetchMangaById(id) {
  return mapManga(await request(`/mangas/${encodeURIComponent(id)}`))
}

export function fetchGenres() {
  return request('/genres')
}

export async function fetchFavorites() {
  const result = await request('/favorites', { authenticated: true })
  return (result.data ?? []).map((favorite) => ({
    id: Number(favorite.manga_id),
    title: favorite.manga_title,
    cover: favorite.cover_image || '',
    score: null,
    type: 'MANGA',
    genres: [],
  }))
}

export async function addFavorite(manga) {
  return request('/favorites', {
    method: 'POST',
    authenticated: true,
    body: {
      manga_id: String(manga.id),
      manga_title: manga.title,
      cover_image: manga.cover,
    },
  })
}

export function removeFavorite(mangaId) {
  return request(`/favorites/${encodeURIComponent(mangaId)}`, {
    method: 'DELETE',
    authenticated: true,
  })
}

export async function fetchReviews(mangaId) {
  const result = await request(`/manga/${encodeURIComponent(mangaId)}/reviews`)
  return result.data
}

export function submitReview(mangaId, { rating, comment }) {
  return request(`/manga/${encodeURIComponent(mangaId)}/reviews`, {
    method: 'POST',
    authenticated: true,
    body: { rating, comment },
  })
}
