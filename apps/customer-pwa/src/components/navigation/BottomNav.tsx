'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Ship, Map, Compass } from 'lucide-react';
import './menu.css';

const menus = [
  { name: 'หน้าแรก', href: '/', Icon: Home },
  { name: 'เรือที่จอง', href: '/profile/bookings', Icon: Ship },
  { name: 'วางแผน', href: '/planner', Icon: Map },
  { name: 'สำรวจ', href: '/explore', Icon: Compass },
] as const;

function resolveActiveIndex(pathname: string): number {
  const p = pathname || '/';
  const idx = menus.findIndex((m) => {
    if (m.href === '/') {
      return p === '/' || p.startsWith('/home');
    }
    return p === m.href || p.startsWith(`${m.href}/`);
  });
  return idx >= 0 ? idx : 0;
}

export default function BottomNav() {
  const pathname = usePathname();
  const active = useMemo(() => resolveActiveIndex(pathname), [pathname]);

  const spring = { type: 'spring' as const, stiffness: 380, damping: 32 };

  return (
    <nav className="bh-bottom-nav" aria-label="เมนูหลัก">
      <div className="bh-bottom-nav__inner">
        <motion.div
          className="bh-bottom-nav__indicator"
          initial={false}
          animate={{ left: `${active * 25}%` }}
          transition={spring}
        />

        {menus.map((m, i) => {
          const Icon = m.Icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`bh-bottom-nav__item ${active === i ? 'bh-bottom-nav__item--active' : ''}`}
              prefetch
            >
              <motion.span
                className="bh-bottom-nav__motion"
                animate={{ y: active === i ? -6 : 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <motion.span
                  className="bh-bottom-nav__icon-wrap"
                  animate={{ scale: active === i ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon className="bh-bottom-nav__icon" strokeWidth={active === i ? 2.5 : 2} />
                </motion.span>
                <span className="bh-bottom-nav__label">{m.name}</span>
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
