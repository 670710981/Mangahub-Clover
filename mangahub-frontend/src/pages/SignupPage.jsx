import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

function SignupPage({ onSuccess, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('กรุณากรอกชื่อที่แสดง');
    if (!email.trim()) return setError('กรุณากรอกอีเมล');
    if (password.length <= 8) return setError('รหัสผ่านต้องมากกว่า 8 ตัวขึ้นไป (ต้องมีอย่างน้อย 9 ตัวอักษร)');
    onSuccess({ name, email });
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-[#f8fafb] text-slate-900 rounded-2xl border border-slate-200 p-8 shadow-xl space-y-6">
      <h1 className="text-3xl font-extrabold text-[#0f172a] text-left tracking-tight">สมัครสมาชิก</h1>
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="ชื่อที่แสดง"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition text-sm shadow-sm"
        />
        <input
          type="email"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition text-sm shadow-sm"
        />
        <input
          type="password"
          placeholder="รหัสผ่าน (มากกว่า 8 ตัวขึ้นไป)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition text-sm shadow-sm"
        />
        <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow text-sm mt-2">
          สมัครสมาชิก
        </button>
      </form>
      <div className="text-left text-sm text-slate-600">
        มีบัญชีแล้ว?{' '}
        <button onClick={onSwitchToLogin} className="text-emerald-600 hover:underline font-semibold">เข้าสู่ระบบ</button>
      </div>
    </div>
  );
}

export default SignupPage;