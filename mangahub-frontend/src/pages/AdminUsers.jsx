import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchAdminUsers, updateAdminUserRole } from '../lib/mangaApi.js'

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyID, setBusyID] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchAdminUsers({ page, perPage: 50, search })
      setUsers(result.users || [])
      setTotal(result.total || 0)
      setHasNext(Boolean(result.has_next))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    if (user?.role === 'admin') loadUsers()
  }, [user, loadUsers])

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  function onSearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  async function changeRole(member) {
    if (member.id === user.id) return
    const nextRole = member.role === 'admin' ? 'member' : 'admin'
    if (nextRole === 'admin' && !window.confirm(`กำหนดให้ ${member.username} เป็น admin หรือไม่? ผู้ใช้ admin เข้าถึงเครื่องมือจัดการระบบได้`)) return

    setBusyID(member.id)
    setError('')
    setNotice('')
    try {
      await updateAdminUserRole(member.id, nextRole)
      setUsers((current) => current.map((item) => item.id === member.id ? { ...item, role: nextRole } : item))
      setNotice(`เปลี่ยน role ของ ${member.username} เป็น ${nextRole} แล้ว`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyID(null)
    }
  }

  
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/admin" className="text-sm font-semibold text-emerald-700 hover:underline">← กลับหน้า Admin</Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">จัดการสมาชิก</h1>
            <p className="mt-2 text-sm text-slate-500">ดูสมาชิกและกำหนดสิทธิ์การใช้งาน</p>
          </div>
          <form onSubmit={onSearch} className="flex w-full gap-2 sm:w-auto">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ค้นหาชื่อหรืออีเมล..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:w-72"
            />
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">ค้นหา</button>
          </form>
        </div>

        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-medium text-slate-700">สมาชิก {total.toLocaleString('th-TH')} บัญชี</p>
            <button type="button" onClick={loadUsers} disabled={loading} className="text-sm font-semibold text-emerald-700 hover:underline disabled:opacity-50">รีเฟรชรายชื่อ</button>
          </div>

          {loading ? (
            <p className="px-6 py-14 text-center text-sm text-slate-500">กำลังโหลดสมาชิก...</p>
          ) : users.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-slate-500">ไม่พบสมาชิก</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">สมาชิก</th>
                    <th className="px-5 py-3 font-semibold">วันที่สมัคร</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 text-right font-semibold">จัดการสิทธิ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((member) => {
                    const isSelf = member.id === user.id
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{member.username}</p>
                          <p className="mt-1 text-xs text-slate-500">{member.email || 'ไม่ระบุอีเมล'}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{member.created_at ? new Date(member.created_at).toLocaleDateString('th-TH') : '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${member.role === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                            {member.role}
                          </span>
                          {isSelf && <span className="ml-2 text-xs text-slate-400">บัญชีของคุณ</span>}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => changeRole(member)}
                            disabled={isSelf || busyID === member.id}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${member.role === 'admin' ? 'border border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                          >
                            {busyID === member.id ? 'กำลังบันทึก...' : member.role === 'admin' ? 'เปลี่ยนเป็น member' : 'ตั้งเป็น admin'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || loading} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">ก่อนหน้า</button>
            <span className="text-xs text-slate-400">หน้า {page} · หน้าละ 50 บัญชี</span>
            <button type="button" onClick={() => setPage((current) => current + 1)} disabled={!hasNext || loading} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">ถัดไป</button>
          </div>
        </section>
      </div>
    </div>
  )
}