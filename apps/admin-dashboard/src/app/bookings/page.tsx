'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { BookingTable } from '@/components/tables/BookingTable';
import { Download, Calendar } from 'lucide-react';

const statusTabs = ['All', 'Confirmed', 'Pending', 'Cancelled'];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-admin-text">Bookings</h1>
            <p className="text-sm text-admin-muted mt-1">
              Manage and track all bookings across the platform.
            </p>
          </div>
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-admin-text shadow-sm'
                    : 'text-admin-muted hover:text-admin-text'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="w-4 h-4 text-admin-muted" />
            <input
              type="date"
              className="input-field w-auto text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-admin-muted text-sm">to</span>
            <input
              type="date"
              className="input-field w-auto text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <BookingTable />
      </div>
    </AdminLayout>
  );
}
