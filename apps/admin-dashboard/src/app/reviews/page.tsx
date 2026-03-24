'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { ReviewTable } from '@/components/tables/ReviewTable';
import { MessageSquare } from 'lucide-react';

const statusTabs = [
  { key: 'all', label: 'All Reviews', count: 8 },
  { key: 'pending', label: 'Pending', count: 3 },
  { key: 'approved', label: 'Approved', count: 4 },
  { key: 'rejected', label: 'Rejected', count: 1 },
];

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-admin-text">Reviews</h1>
            <p className="text-sm text-admin-muted mt-1">
              Moderate and manage customer reviews.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              3 reviews pending moderation
            </span>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-white text-admin-text shadow-sm'
                  : 'text-admin-muted hover:text-admin-text'
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? 'bg-ocean-100 text-ocean-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <ReviewTable statusFilter={activeTab} />
      </div>
    </AdminLayout>
  );
}
