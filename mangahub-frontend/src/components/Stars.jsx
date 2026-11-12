// score เต็ม 10 -> ดาว 5 ดวง (เติมสีตามสัดส่วน)
 function Stars({ score }) {
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score * 10))

  return (
    <span
      className="relative inline-block text-sm leading-none tracking-tight"
      role="img"
      aria-label={score == null ? 'ยังไม่มีเรตติ้ง' : `เรตติ้ง ${(score / 2).toFixed(1)} จาก 5 ดาว`}
    >
      <span className="text-slate-400/40">★★★★★</span>
      <span
        className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-amber-400"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  )
}

export default Stars;