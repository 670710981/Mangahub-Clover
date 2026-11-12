function Footer() {
  return (
    <footer className="bg-[#0b0e14] border-t border-slate-800 py-6 px-4 sm:px-8 mt-auto text-sm text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left font-medium text-slate-300">
          MangaHub โปรเจ็กต์รวบรวมมังงะ
        </div>
        <div className="text-center sm:text-right text-slate-400 text-xs sm:text-sm">
          ข้อมูลมังงะจาก AniList
        </div>
      </div>
    </footer>
  );
}

export default Footer;