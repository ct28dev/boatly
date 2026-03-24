'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const trips = [
  { time: '08:00', title: 'ขึ้นเรือ', location: 'ท่าเรือ' },
  { time: '10:00', title: 'วัดไชยวัฒนาราม', location: 'อยุธยา' },
  { time: '13:00', title: 'ทานอาหาร', location: 'ร้านริมน้ำ' },
];

export default function PlannerPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-28">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow"
        >
          <ArrowLeft className="h-5 w-5 text-dark" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">📍 แผนการเดินทาง</h1>
          <p className="text-xs text-slate-500">ไทม์ไลน์แนวตั้ง · ต่อ API แผนจริงได้ที่นี่</p>
        </div>
      </header>

      <div className="relative border-l-2 border-primary pl-5">
        {trips.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative pb-8 last:pb-0"
          >
            <div className="absolute -left-[25px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-primary shadow" />
            <div className="card shadow-md">
              <p className="text-sm font-medium text-primary">{t.time}</p>
              <h3 className="mt-1 font-bold text-dark">{t.title}</h3>
              <p className="text-xs text-slate-500">{t.location}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Details
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-dark"
                >
                  Notes
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Link
        href="/booking"
        className="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-light text-white shadow-lg shadow-primary/40"
        aria-label="เพิ่มทริป"
      >
        +
      </Link>
    </div>
  );
}
