import { useMemo, useState } from 'react'
import { fetchMappedManga, fetchMangaPage, fetchRawManga } from '../lib/mangaApi.js'

const IDLE = { status: 'idle', message: 'ยังไม่ได้ส่ง request', output: '', path: '' }

export default function ApiLab() {
  const [term, setTerm] = useState('')
  const [state, setState] = useState(IDLE)
  const loading = state.status === 'loading'

  const searchPath = useMemo(() => {
    const params = new URLSearchParams({ page: '1', perPage: '5', search: term.trim() })
    return `/api/mangas?${params}`
  }, [term])

  async function run(task, path, successText) {
    setState({ status: 'loading', message: 'กำลังส่ง request ไปยัง Go API...', output: '', path })
    const started = performance.now()

    try {
      const data = await task()
      const elapsed = Math.round(performance.now() - started)
      setState({
        status: 'success',
        message: `${successText} (${elapsed} ms)`,
        output: JSON.stringify(data, null, 2),
        path,
      })
    } catch (error) {
      setState({ status: 'error', message: error.message, output: '', path })
    }
  }

  function showRaw() {
    return run(
      () => fetchRawManga({ page: 1, perPage: 5, search: term.trim() }),
      searchPath,
      'ได้ JSON ดิบจาก Go API / Supabase',
    )
  }

  function showMapped() {
    return run(
      () => fetchMappedManga({ page: 1, perPage: 5, search: term.trim() }),
      searchPath,
      'แปลงข้อมูลด้วย mapManga() แล้ว',
    )
  }

  function showPopular() {
    return run(
      async () => (await fetchMangaPage({ page: 1, perPage: 10 })).items,
      '/api/mangas?page=1&perPage=10',
      'ได้มังงะยอดนิยมจาก Supabase ผ่าน Go API',
    )
  }

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-[#f6fdfa] px-4 py-10 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">API Lab</h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          ทดลองเรียก MangaHub Go API และเปรียบเทียบ JSON ดิบกับข้อมูลที่แปลงแล้ว
        </p>

        <form
          className="mt-6 flex flex-col gap-3 lg:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            showRaw()
          }}
        >
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="ค้นหาชื่อมังงะ เช่น One Piece"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            ดู JSON ดิบ
          </button>
          <button
            type="button"
            onClick={showMapped}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-500 disabled:opacity-50"
          >
            ผ่าน mapManga()
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={showPopular}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-500 disabled:opacity-50"
          >
            getManga() · มังงะยอดนิยม
          </button>
          <button
            type="button"
            onClick={() => setState(IDLE)}
            disabled={loading}
            className="px-2 py-2 text-sm text-slate-500 underline underline-offset-4 hover:text-emerald-700 disabled:opacity-50"
          >
            ล้างผลลัพธ์
          </button>
          <p className="text-xs text-slate-500">Browser เรียก Go API; ข้อมูลอ่านจาก Supabase</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-xs">
          {state.path && (
            <span className="rounded-md bg-emerald-100 px-2.5 py-1.5 font-bold text-emerald-700">
              GET
            </span>
          )}
          <span className="break-all text-slate-500">{state.path || searchPath}</span>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/60">
          <div className="flex flex-wrap items-center gap-3 border-b border-emerald-100 px-5 py-4">
            <span className="text-sm text-slate-600">สถานะ</span>
            <span
              className={`text-sm font-semibold ${
                state.status === 'success'
                  ? 'text-emerald-700'
                  : state.status === 'error'
                    ? 'text-rose-600'
                    : state.status === 'loading'
                      ? 'text-sky-700'
                      : 'text-slate-500'
              }`}
            >
              {state.status}
            </span>
             {state.status !== 'idle' && (
            <span className={`text-sm ${state.status === 'error' ? 'text-rose-600' : 'text-slate-600'}`}>
                {state.message}
              </span>
            )}
          </div>

          {state.output ? (
            <pre className="m-4 max-h-[560px] overflow-auto rounded-xl bg-white p-5 font-mono text-xs leading-6 text-slate-800 sm:text-sm">
              {state.output}
            </pre>
          ) : (
            <p className="px-5 py-8 font-mono text-sm text-slate-500">
              {state.status === 'idle' ? 'ยังไม่ได้ส่ง request' : 'กดปุ่มเพื่อดูผลลัพธ์ JSON'}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}