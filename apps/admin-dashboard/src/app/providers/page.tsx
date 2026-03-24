'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { ProviderTable } from '@/components/tables/ProviderTable';
import { Plus } from 'lucide-react';

const tabs = [
  { key: 'all', label: 'All Providers' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'suspended', label: 'Suspended' },
];

export default function ProvidersPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-admin-text">Providers</h1>
            <p className="text-sm text-admin-muted mt-1">
              Manage tour and boat providers on the platform.
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Provider
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-admin-text shadow-sm'
                  : 'text-admin-muted hover:text-admin-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ProviderTable statusFilter={activeTab} />
      </div>
    </AdminLayout>
  );
}
