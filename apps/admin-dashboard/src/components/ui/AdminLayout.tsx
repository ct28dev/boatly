'use client';

import { Sidebar, useSidebarStore } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <div className="min-h-screen bg-admin-bg">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'ml-[72px]' : 'ml-[260px]'
        )}
      >
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
