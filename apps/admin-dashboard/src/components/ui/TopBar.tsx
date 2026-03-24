'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  providers: 'Providers',
  boats: 'Boats',
  tours: 'Tours',
  bookings: 'Bookings',
  reviews: 'Reviews',
  finance: 'Finance',
  new: 'New',
  login: 'Login',
};

export function TopBar() {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg) => breadcrumbMap[seg] || seg);

  const notifications = [
    { id: 1, text: 'New booking #1234 needs approval', time: '5 min ago' },
    { id: 2, text: 'Provider "Sea Explorer" registered', time: '1 hour ago' },
    { id: 3, text: 'Review flagged for moderation', time: '2 hours ago' },
  ];

  return (
    <header className="h-16 bg-white border-b border-admin-border flex items-center justify-between px-6 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-admin-muted">Admin</span>
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-admin-muted" />
            <span
              className={
                i === crumbs.length - 1
                  ? 'text-admin-text font-medium'
                  : 'text-admin-muted'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 w-64 text-sm bg-gray-50 border border-admin-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-admin-muted hover:text-admin-text rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-admin-border shadow-lg z-50">
                <div className="px-4 py-3 border-b border-admin-border">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-admin-border last:border-0"
                    >
                      <p className="text-sm text-admin-text">{n.text}</p>
                      <p className="text-xs text-admin-muted mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-admin-border">
                  <button className="text-xs text-ocean-500 font-medium hover:text-ocean-600">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User dropdown */}
        <div className="flex items-center gap-3 pl-4 border-l border-admin-border">
          <div className="w-8 h-8 rounded-full bg-ocean-500 flex items-center justify-center text-white text-sm font-semibold">
            A
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-admin-text">Admin</p>
            <p className="text-xs text-admin-muted">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
