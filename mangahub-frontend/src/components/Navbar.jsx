import { NavLink } from 'react-router-dom';

// ฟังก์ชันเลือก class: ถ้าเป็นหน้าปัจจุบัน ให้สีฟ้า + ขีดเส้นใต้
const linkClass = ({ isActive }) =>
  isActive
    ? 'text-cyan-400 font-semibold underline underline-offset-4'
    : 'text-slate-300 hover:text-cyan-400 transition';

function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-green-600 px-6 py-4">
      <span className="text-xl font-bold text-white">
      🔖 MANGA<span className="text-red-400">Hub</span>
      </span>
      <div className="hidden gap-6 text-white md:flex">
        <a href="#" className="hover:text-green-300 transition">หน้าแรก</a>
        <a href="#" className="hover:text-green-300 transition">มังงะ</a>
        <a href="#" className="hover:text-green-300 transition">รายการโปรด</a>
      </div>
      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold
                         text-white hover:bg-green-300 transition">
        เข้าสู่ระบบ
      </button>
    </nav>
  );
}

export default Navbar;