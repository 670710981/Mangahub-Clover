function Footer() {
  return (
    <footer className="mt-auto bg-slate-900 px-6 py-8">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 text-sm
                      text-slate-400 md:grid-cols-3">
        <div>
          <p className="mb-2 font-bold text-white">🎬 MovieHub</p>
          <p>โปรเจกต์ประกอบวิชา 520 341<br />Client Side Web Programming</p>
        </div>
        <div>
          <p className="mb-2 font-semibold text-slate-200">เมนู</p>
          <p>หน้าแรก · หนังใหม่ · รายการโปรด</p>
        </div>
        <div>
          <p className="mb-2 font-semibold text-slate-200">ติดต่อ</p>
          <p>คณะวิศวกรรมศาสตร์ฯ<br />มหาวิทยาลัยศิลปากร</p>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        © 2026 MovieHub — สร้างเพื่อการเรียนรู้เท่านั้น
      </p>
    </footer>
  );
}

export default Footer;