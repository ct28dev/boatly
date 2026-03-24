'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Ship,
  Map,
  CalendarCheck,
  Star,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Anchor,
} from 'lucide-react';
import { create } from 'zustand';

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
  setCollapsed: (v) => set({ collapsed: v }),
}));

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Providers', href: '/providers', icon: Building2 },
  { label: 'Boats', href: '/boats', icon: Ship },
  { label: 'Tours', href: '/tours', icon: Map },
  { label: 'Bookings', href: '/bookings', icon: CalendarCheck },
  { label: 'Reviews', href: '/reviews', icon: Star },
  { label: 'Finance', href: '/finance', icon: DollarSign },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar text-white flex flex-col transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 bg-ocean-500 rounded-lg flex items-center justify-center shrink-0">
          <Anchor className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">BOATLY</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-ocean-500 text-white shadow-lg shadow-ocean-500/25'
                  : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-ocean-500/20 flex items-center justify-center text-ocean-300 text-sm font-semibold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-400 truncate">admin@boatly.com</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!collapsed && (
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-sidebar-hover transition-colors flex-1">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
          <button
            onClick={toggle}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-sidebar-hover transition-colors shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
