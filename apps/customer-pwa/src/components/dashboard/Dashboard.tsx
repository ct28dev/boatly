'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { href: '/', label: 'หน้าแรก', emoji: '🏠' },
  { href: '/profile/bookings', label: 'เรือที่จอง', emoji: '🛥️' },
  { href: '/planner', label: 'วางแผน', emoji: '🗺️' },
  { href: '/explore', label: 'สำรวจ', emoji: '📍' },
];

const mockPopular = [
  { id: '1', title: 'อยุธยา Sunset', loc: 'อยุธยา', price: 900 },
  { id: '2', title: 'ล่องเจ้าพระยา', loc: 'กรุงเทพฯ', price: 650 },
  { id: '3', title: 'เกาะพีพี', loc: 'พังงา', price: 1500 },
];

export default function Dashboard() {
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <div className="space-y-4 p-4 pb-8">
      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex items-center gap-3 shadow-md"
      >
        <Search className="h-5 w-5 shrink-0 text-primary" />
        <input
          className="w-full bg-transparent text-sm text-dark outline-none placeholder:text-slate-400"
          placeholder="ค้นหาทริป, จังหวัด, บริการ..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              router.push(`/tours${q ? `?q=${encodeURIComponent(q)}` : ''}`);
            }
          }}
        />
      </motion.div>

      {/* Quick menu — Super App */}
      <div className="grid grid-cols-4 gap-3">
        {menuItems.map((m, i) => (
          <motion.div key={m.href} whileTap={{ scale: 0.92 }}>
            <Link
              href={m.href}
              className="card flex min-h-[88px] flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary to-sky-600 p-3 text-center text-white shadow-lg shadow-primary/25"
            >
              <span className="text-2xl leading-none" aria-hidden>
                {m.emoji}
              </span>
              <span className="text-[10px] font-bold leading-tight">{m.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* AI */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Link
          href="/planner"
          className="card block overflow-hidden bg-gradient-to-r from-secondary to-primary p-4 text-white shadow-lg"
        >
          <h2 className="text-lg font-bold">✨ วางแผนทริปอัตโนมัติ</h2>
          <p className="mt-1 text-sm text-white/90">ให้ AI จัดทริปให้คุณ</p>
          <span className="mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-dark">
            เริ่มวางแผน
          </span>
        </Link>
      </motion.div>

      {/* Popular */}
      <section>
        <div className="mb-3 flex items-center justify-between px-0.5">
          <h3 className="text-base font-bold text-dark">🔥 ทริปยอดนิยม</h3>
          <Link
            href="/trips"
            className="flex items-center gap-0.5 text-sm font-medium text-primary"
          >
            ดูทั้งหมด <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mockPopular.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/tours/${t.id}`}
                className="card block w-[150px] shrink-0 shadow-md"
              >
                <div className="mb-2 h-20 rounded-xl bg-gradient-to-br from-slate-200 to-slate-100" />
                <p className="line-clamp-2 text-sm font-semibold text-dark">{t.title}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {t.loc}
                </div>
                <p className="mt-1 text-sm font-bold text-primary">
                  ฿{t.price.toLocaleString()}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <p className="text-center text-[11px] text-slate-400">
        เวอร์ชัน Production UI · ต่อ API ผ่าน{' '}
        <code className="rounded bg-slate-100 px-1">src/services/api.ts</code>
      </p>
    </div>
  );
}
