// ถ้ามีรูปให้แสดงรูป ถ้าไม่มีให้แสดงตัวอักษรแรกของชื่อที่ใช้สมัคร
export default function Avatar({ name = '', src, className = 'h-9 w-9 text-sm' }) {
  const letter = (name.trim()[0] ?? '?').toUpperCase()

  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${className}`} />
  }

  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-full bg-emerald-500 font-semibold text-white ${className}`}
    >
      {letter}
    </span>
  )
}
