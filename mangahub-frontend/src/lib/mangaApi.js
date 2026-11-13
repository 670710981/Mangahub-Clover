const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api'

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`)
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
