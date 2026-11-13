function About() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-2xl font-semibold text-slate-900">เกี่ยวกับ MangaHub</h1>
        <p className="mt-4 leading-relaxed text-slate-600">
          โปรเจกต์ฝึกหัดในรายวิชา 520 341 Client Side Web Programming ใช้เรียนรู้การเรียก API ด้วย
          React (fetch, useEffect, การจัดการสถานะ loading / error / success)
          และการเตรียมหน้าเว็บให้พร้อมเชื่อมกับ Backend ที่เขียนด้วย Go
        </p>

        <h2 className="mt-8 font-semibold text-sky-900">ทีม</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-700">
          <li>ภูเบศ โรมจุมจัง (670710210)</li>
          <li>ภัทรพล ภวาภิรมย์ (670710981)</li>
        </ul>
      </div>

      <hr className="my-8 w-full border-t border-slate-200" />

      <div className="mx-auto flex max-w-3xl items-start gap-3 px-4 text-sm text-slate-500">
        <span className="font-bold text-emerald-600">Anilist</span>
        <p>ข้อมูลมังงะและภาพดึงมาจาก anilist ทั้งหมด</p>
      </div>
    </div>
  )
}

export default About;