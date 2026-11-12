const ENDPOINT = 'https://graphql.anilist.co'
const CACHE_PREFIX = 'mangahub:cache:'

const FIELDS = `
  id
  title { romaji english native }
  coverImage { large }
  averageScore
  countryOfOrigin
  genres
`

const LIST_QUERY = `
  query ($page: Int, $perPage: Int, $search: String, $genre: String, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(type: MANGA, isAdult: false, search: $search, genre: $genre, sort: $sort) {
        ${FIELDS}
      }
    }
  }
`

const DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: MANGA) {
      id
      title { romaji english native }
      coverImage { extraLarge large }
      description(asHtml: false)
      averageScore
      countryOfOrigin
      chapters
    }
  }
`

const GENRES_QUERY = `query { GenreCollection }`

const TYPE_BY_COUNTRY = { JP: 'MANGA', KR: 'MANHWA', CN: 'MANHUA', TW: 'MANHUA' }

/** ยิง GraphQL ไป AniList แล้วคืน JSON ดิบ ({ data }) */
export async function anilistRequest(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.errors) {
    throw new Error(json?.errors?.[0]?.message ?? `HTTP ${res.status}`)
  }
  return json
}

/** แปลงข้อมูลดิบของ AniList เป็นรูปแบบที่หน้าเว็บใช้ (score เป็นเต็ม 10) */
export function toManga(media) {
  return {
    id: media.id,
    title: media.title.english || media.title.romaji || media.title.native || 'Untitled',
    cover: media.coverImage?.large ?? '',
    score: media.averageScore != null ? media.averageScore / 10 : null,
    type: TYPE_BY_COUNTRY[media.countryOfOrigin] ?? 'MANGA',
    genres: media.genres ?? [],
  }
}

function listVariables({ page = 1, perPage = 30, search, genre } = {}) {
  return {
    page,
    perPage,
    search: search || undefined,
    genre: genre || undefined,
    sort: [search ? 'SEARCH_MATCH' : 'POPULARITY_DESC'],
  }
}

export async function fetchMangaPage(params) {
  const json = await anilistRequest(LIST_QUERY, listVariables(params))
  const { media, pageInfo } = json.data.Page
  return { items: media.map(toManga), hasNext: pageInfo.hasNextPage }
}

// เรื่องย่อจาก AniList อาจมีแท็ก HTML (เช่น <br>) ปนมา จึงล้างออกก่อนแสดง
function cleanDescription(text) {
  if (!text) return ''
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** ดึงรายละเอียดมังงะ 1 เรื่อง (chapters เป็น null ได้ถ้ายังไม่จบ/ไม่ระบุ) */
export async function fetchMangaById(id) {
  const json = await anilistRequest(DETAIL_QUERY, { id: Number(id) })
  const media = json.data.Media
  return {
    ...toManga(media),
    cover: media.coverImage?.extraLarge ?? media.coverImage?.large ?? '',
    description: cleanDescription(media.description),
    chapters: media.chapters,
  }
}

export async function fetchGenres() {
  const json = await anilistRequest(GENRES_QUERY)
  return json.data.GenreCollection.filter((g) => g !== 'Hentai')
}

/* ---------- ส่วนที่ใช้ในหน้า API Lab ---------- */

export function fetchRawManga(term) {
  return anilistRequest(LIST_QUERY, listVariables({ page: 1, perPage: 5, search: term }))
}

export async function fetchMappedManga(term) {
  const json = await fetchRawManga(term)
  return json.data.Page.media.map(toManga)
}

function todayKey() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function clearCache() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX))
  keys.forEach((k) => localStorage.removeItem(k))
  return keys.length
}

/** มังงะยอดนิยม เก็บ cache ใน localStorage วันละครั้ง */
export async function getPopularManga() {
  const started = performance.now()
  const key = `${CACHE_PREFIX}popular:${todayKey()}`

  try {
    const cached = localStorage.getItem(key)
    if (cached) {
      return {
        items: JSON.parse(cached),
        source: 'cache',
        ms: Math.round(performance.now() - started),
      }
    }
  } catch {
    // อ่าน cache ไม่ได้ ก็ยิง API จริงแทน
  }

  const { items } = await fetchMangaPage({ page: 1, perPage: 10 })
  try {
    clearCache()
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // เก็บ cache ไม่ได้ก็ข้ามไป
  }
  return { items, source: 'network', ms: Math.round(performance.now() - started) }
}
