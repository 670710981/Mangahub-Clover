function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b-4 border-slate-950 bg-[#fffdf7] px-6 py-4 shadow-[0_4px_0_rgba(15,23,42,0.08)]">
      <span className="text-xl font-black italic tracking-tight text-slate-950">
        📖 MANGA<span className="text-red-600">HUB</span>
      </span>
      <div className="hidden gap-6 font-bold text-slate-700 md:flex">
        <a href="#home" className="transition hover:text-red-600">หน้าแรก</a>
        <a href="#latest" className="transition hover:text-red-600">หนังใหม่</a>
        <a href="#favorites" className="transition hover:text-red-600">รายการโปรด</a>
      </div>
      <button className="rounded-lg border-2 border-slate-950 bg-red-600 px-4 py-2 text-sm font-bold
                         text-white shadow-[3px_3px_0_#0f172a] transition hover:-translate-y-0.5 hover:bg-red-700">
        เข้าสู่ระบบ
      </button>
    </nav>
  );
}

export default Navbar;