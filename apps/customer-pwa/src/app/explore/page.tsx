'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Compass } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="space-y-4 p-4 pb-28">
      <h1 className="text-xl font-bold text-dark">สำรวจ</h1>
      <p className="text-sm text-slate-600">
        ท่าเรือใกล้คุณ · แผนที่ · ค้นหาทริป
      </p>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Link
          href="/map"
          className="card flex items-center gap-4 bg-gradient-to-r from-sky-500 to-primary p-5 text-white shadow-lg"
        >
          <MapPin className="h-10 w-10 shrink-0 opacity-90" />
          <div>
            <h2 className="font-bold">สำรวจบนแผนที่</h2>
            <p className="text-sm text-white/85">ดูท่าเรือและจุดขึ้นเรือ</p>
          </div>
        </Link>
      </motion.div>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Link
          href="/tours"
          className="card flex items-center gap-4 border border-slate-100 p-5 shadow"
        >
          <Compass className="h-10 w-10 shrink-0 text-primary" />
          <div>
            <h2 className="font-bold text-dark">ค้นหาทริป</h2>
            <p className="text-sm text-slate-500">กรองตามจังหวัดและบริการ</p>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
