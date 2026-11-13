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
    author: m.author || '',
    cover: m.cover_url || '',
    score: m.score ?? null,
    type: 'MANGA',
    genres,
    status: m.status || '',
    description: m.synopsis || '',
    chapters: m.chapters ?? null,
    reviewCount: m.review_count ?? 0,
  }
}

export async function fetchMangaPage({ page = 1, perPage = 30, search = '', genre = '' } = {}) {
  const result = await fetchRawManga({ page, perPage, search, genre })
  return { items: result.items.map(mapManga), hasNext: result.has_next }
}

export function fetchRawManga({ page = 1, perPage = 10, search = '', genre = '' } = {}) {
  const params = new URLSearchParams({ page, perPage, search, genre: genre || '' })
  return request(`/mangas?${params}`)
}

export async function fetchMappedManga(params = {}) {
  const result = await fetchRawManga(params)
  return result.items.map(mapManga)
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

export function fetchAdminStats() {
  return request('/admin/stats', { authenticated: true })
}

export function syncAniList(pages) {
  return request('/admin/anilist/sync', {
    method: 'POST',
    authenticated: true,
    body: { pages },
  })
}

export function updateManga(manga) {
  return request(`/mangas/${encodeURIComponent(manga.id)}`, {
    method: 'PUT',
    authenticated: true,
    body: {
      title: manga.title.trim(),
      author: manga.author || null,
      genre: Array.isArray(manga.genres) ? manga.genres.join(', ') : manga.genres,
      status: manga.status || 'unknown',
      synopsis: manga.description || null,
      cover_url: manga.cover || null,
      score: manga.score,
      chapters: manga.chapters,
    },
  })
}

export function deleteManga(id) {
  return request(`/mangas/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    authenticated: true,
  })
}

export function fetchAdminUsers({ page = 1, perPage = 50, search = '' } = {}) {
  const params = new URLSearchParams({ page, perPage, search })
  return request(`/admin/users?${params}`, { authenticated: true })
}

export function updateAdminUserRole(id, role) {
  return request(`/admin/users/${encodeURIComponent(id)}/role`, {
    method: 'PATCH',
    authenticated: true,
    body: { role },
  })
}