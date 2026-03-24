'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { getStatusColor } from '@/lib/utils';
import { Plus, Eye, Edit, Ship } from 'lucide-react';

interface Boat {
  id: string;
  name: string;
  type: string;
  provider: string;
  capacity: number;
  status: string;
  year: number;
  registration: string;
  [key: string]: unknown;
}

const mockBoats: Boat[] = [
  { id: 'BT-001', name: 'Sea Breeze I', type: 'Speedboat', provider: 'Sea Explorer Co.', capacity: 30, status: 'Active', year: 2023, registration: 'TH-PKT-1234' },
  { id: 'BT-002', name: 'Ocean Star', type: 'Catamaran', provider: 'Sea Explorer Co.', capacity: 50, status: 'Active', year: 2022, registration: 'TH-PKT-1235' },
  { id: 'BT-003', name: 'Wave Runner', type: 'Speedboat', provider: 'Island Hopper Tours', capacity: 25, status: 'Active', year: 2024, registration: 'TH-KBI-0321' },
  { id: 'BT-004', name: 'Island Cruiser', type: 'Ferry', provider: 'Blue Horizon Marine', capacity: 80, status: 'Maintenance', year: 2021, registration: 'TH-PKT-0876' },
  { id: 'BT-005', name: 'Sunset Dream', type: 'Yacht', provider: 'Sea Explorer Co.', capacity: 12, status: 'Active', year: 2024, registration: 'TH-PKT-2456' },
  { id: 'BT-006', name: 'Coral Queen', type: 'Catamaran', provider: 'Coral Bay Boats', capacity: 45, status: 'Active', year: 2023, registration: 'TH-KBI-0543' },
  { id: 'BT-007', name: 'Thunder Bolt', type: 'Speedboat', provider: 'Andaman Adventures', capacity: 20, status: 'Active', year: 2025, registration: 'TH-PKT-3789' },
  { id: 'BT-008', name: 'Pearl Harbor', type: 'Ferry', provider: 'Gulf Star Marine', capacity: 100, status: 'Active', year: 2020, registration: 'TH-SRT-1122' },
  { id: 'BT-009', name: 'Blue Lagoon', type: 'Longtail', provider: 'Island Hopper Tours', capacity: 8, status: 'Active', year: 2022, registration: 'TH-KBI-0654' },
  { id: 'BT-010', name: 'Sea Phoenix', type: 'Speedboat', provider: 'Blue Horizon Marine', capacity: 35, status: 'Inactive', year: 2019, registration: 'TH-PKT-0999' },
  { id: 'BT-011', name: 'Neptune\'s Ride', type: 'Yacht', provider: 'Phuket Sailing Club', capacity: 15, status: 'Active', year: 2024, registration: 'TH-PKT-4567' },
  { id: 'BT-012', name: 'Gulf Runner', type: 'Speedboat', provider: 'Gulf Star Marine', capacity: 28, status: 'Active', year: 2023, registration: 'TH-SRT-2233' },
];

const typeFilter = ['All', 'Speedboat', 'Catamaran', 'Yacht', 'Ferry', 'Longtail'];
const statusFilter = ['All', 'Active', 'Maintenance', 'Inactive'];

export default function BoatsPage() {
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredBoats = mockBoats.filter((b) => {
    if (selectedType !== 'All' && b.type !== selectedType) return false;
    if (selectedStatus !== 'All' && b.status !== selectedStatus) return false;
    return true;
  });

  const columns: Column<Boat>[] = [
    {
      key: 'name',
      label: 'Boat',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-ocean-50 flex items-center justify-center">
            <Ship className="w-4 h-4 text-ocean-500" />
          </div>
          <div>
            <p className="font-medium text-admin-text">{item.name}</p>
            <p className="text-xs text-admin-muted">{item.registration}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'provider', label: 'Provider', sortable: true },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      render: (item) => <span>{item.capacity} pax</span>,
    },
    { key: 'year', label: 'Year', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span className={getStatusColor(item.status)}>{item.status}</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-admin-text">Boats</h1>
            <p className="text-sm text-admin-muted mt-1">
              Manage all registered boats on the platform.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Boat
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-admin-muted">Type:</span>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {typeFilter.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedType === t
                      ? 'bg-white text-admin-text shadow-sm'
                      : 'text-admin-muted hover:text-admin-text'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-admin-muted">Status:</span>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {statusFilter.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedStatus === s
                      ? 'bg-white text-admin-text shadow-sm'
                      : 'text-admin-muted hover:text-admin-text'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredBoats}
          searchPlaceholder="Search boats..."
          actions={(item) => (
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-admin-muted hover:text-ocean-500 rounded-lg hover:bg-gray-100" title="View">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-admin-muted hover:text-ocean-500 rounded-lg hover:bg-gray-100" title="Edit">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>
    </AdminLayout>
  );
}
