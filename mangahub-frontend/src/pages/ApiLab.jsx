import { useState } from 'react'
import { fetchGenres, fetchMangaPage } from '../lib/mangaApi.js'

const btnPrimary =
  'rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50'
const btnOutline =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50'

const IDLE = { status: 'idle', message: 'ยังไม่ได้ส่ง request', output: '' }

function ApiLab() {
  const [term, setTerm] = useState('')
  const [state, setState] = useState(IDLE)
  const loading = state.status === 'loading'

  async function run(task) {
    setState({ status: 'loading', message: 'กำลังส่ง request...', output: '' })
    try {
      const { data, note } = await task()
      setState({ status: 'success', message: note, output: JSON.stringify(data, null, 2) })
    } catch (e) {
      setState({ status: 'error', message: e.message, output: '' })
    }
  }

  const showRaw = () =>
    run(async () => {
      const t0 = performance.now()
      const data = await fetchGenres()
      return { data, note: `ได้ประเภทจาก Go API (${Math.round(performance.now() - t0)} ms)` }
    })

  const showMapped = () =>
    run(async () => {
      const t0 = performance.now()
      const { items: data } = await fetchMangaPage({ page: 1, perPage: 10, search: term.trim() })
      return {
        data,
        note: `ได้ข้อมูล ${data.length} รายการจาก Supabase ผ่าน Go (${Math.round(performance.now() - t0)} ms)`,
      }
    })

  const showPopular = () =>
    run(async () => {
      const t0 = performance.now()
      const { items } = await fetchMangaPage({ page: 1, perPage: 10 })
      return {
        data: items,
        note: `ได้ข้อมูล ${items.length} รายการจาก Supabase ผ่าน Go (${Math.round(performance.now() - t0)} ms)`,
      }
    })

  const onClearCache = () => {
    setState({ status: 'idle', message: 'ข้อมูลหน้าเว็บอ่านจาก Go API', output: '' })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">API Lab</h1>
      <p className="mt-2 text-slate-600">
        ตรวจสอบข้อมูลที่ frontend อ่านจาก Supabase ผ่าน Go API
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ชื่อมังงะ เช่น one piece"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <button type="button" onClick={showRaw} disabled={loading} className={btnPrimary}>
          ดูประเภทจาก Go
        </button>
        <button type="button" onClick={showMapped} disabled={loading} className={btnOutline}>
          ค้นหาจาก Supabase
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button type="button" onClick={showPopular} disabled={loading} className={btnOutline}>
          ดูมังงะยอดนิยมจาก Supabase
        </button>
        <button
          type="button"
          onClick={onClearCache}
          className="text-sm text-slate-600 underline hover:text-emerald-700"
        >
          สถานะข้อมูล
        </button>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        ข้อมูลถูกนำเข้าจาก AniList โดย backend แล้วอ่านจากฐานข้อมูล Supabase
      </p>
      <p className="mt-2 break-all font-mono text-xs text-slate-400">
        GET /api/mangas?page=1&perPage=10&search={term}
      </p>

      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="font-semibold text-slate-700">
          สถานะ: <span className="font-normal">{state.status}</span>
        </p>
        <p
          className={`mt-2 text-sm ${state.status === 'error' ? 'text-red-600' : 'text-slate-600'}`}
        >
          {state.message}
        </p>
        {state.output && (
          <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700">
            {state.output}
          </pre>
        )}
      </div>
    </div>
  )
}


export default ApiLab;
