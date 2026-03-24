'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { Plus, Eye, Edit, Map } from 'lucide-react';
import Link from 'next/link';

interface Tour {
  id: string;
  name: string;
  provider: string;
  boatType: string;
  duration: string;
  price: number;
  capacity: number;
  bookings: number;
  status: string;
  location: string;
  [key: string]: unknown;
}

const mockTours: Tour[] = [
  { id: 'TR-001', name: 'Phi Phi Island Day Trip', provider: 'Sea Explorer Co.', boatType: 'Speedboat', duration: '8h', price: 2500, capacity: 30, bookings: 145, status: 'Active', location: 'Phuket' },
  { id: 'TR-002', name: 'James Bond Island Tour', provider: 'Sea Explorer Co.', boatType: 'Longtail', duration: '6h', price: 3200, capacity: 8, bookings: 98, status: 'Active', location: 'Phang Nga' },
  { id: 'TR-003', name: 'Similan Islands Diving', provider: 'Andaman Adventures', boatType: 'Speedboat', duration: '10h', price: 4500, capacity: 20, bookings: 67, status: 'Active', location: 'Similan' },
  { id: 'TR-004', name: 'Krabi 4 Islands Tour', provider: 'Island Hopper Tours', boatType: 'Longtail', duration: '7h', price: 1800, capacity: 8, bookings: 210, status: 'Active', location: 'Krabi' },
  { id: 'TR-005', name: 'Hong Island Sunset Tour', provider: 'Island Hopper Tours', boatType: 'Speedboat', duration: '5h', price: 2800, capacity: 25, bookings: 89, status: 'Active', location: 'Krabi' },
  { id: 'TR-006', name: 'Coral Island Snorkeling', provider: 'Coral Bay Boats', boatType: 'Catamaran', duration: '6h', price: 1500, capacity: 45, bookings: 312, status: 'Active', location: 'Phuket' },
  { id: 'TR-007', name: 'Rok Island Adventure', provider: 'Blue Horizon Marine', boatType: 'Speedboat', duration: '9h', price: 3800, capacity: 35, bookings: 56, status: 'Active', location: 'Lanta' },
  { id: 'TR-008', name: 'Koh Lipe Express', provider: 'Gulf Star Marine', boatType: 'Ferry', duration: '4h', price: 1200, capacity: 100, bookings: 420, status: 'Active', location: 'Satun' },
  { id: 'TR-009', name: 'Racha Island Premium', provider: 'Sea Explorer Co.', boatType: 'Yacht', duration: '8h', price: 5500, capacity: 12, bookings: 28, status: 'Active', location: 'Phuket' },
  { id: 'TR-010', name: 'Angthong Marine Park', provider: 'Gulf Star Marine', boatType: 'Catamaran', duration: '10h', price: 3500, capacity: 50, bookings: 175, status: 'Draft', location: 'Koh Samui' },
  { id: 'TR-011', name: 'Phang Nga Bay Explorer', provider: 'Sea Explorer Co.', boatType: 'Speedboat', duration: '7h', price: 2800, capacity: 30, bookings: 89, status: 'Inactive', location: 'Phang Nga' },
];

const statusTabs = ['All', 'Active', 'Draft', 'Inactive'];

export default function ToursPage() {
  const [activeStatus, setActiveStatus] = useState('All');

  const filteredTours = activeStatus === 'All'
    ? mockTours
    : mockTours.filter((t) => t.status === activeStatus);

  const columns: Column<Tour>[] = [
    {
      key: 'name',
      label: 'Tour',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-ocean-50 flex items-center justify-center">
            <Map className="w-4 h-4 text-ocean-500" />
          </div>
          <div>
            <p className="font-medium text-admin-text">{item.name}</p>
            <p className="text-xs text-admin-muted">{item.provider}</p>
          </div>
        </div>
      ),
    },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'boatType', label: 'Boat Type' },
    { key: 'duration', label: 'Duration' },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (item) => <span className="font-medium">{formatCurrency(item.price)}</span>,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (item) => <span>{item.capacity} pax</span>,
    },
    {
      key: 'bookings',
      label: 'Bookings',
      sortable: true,
      render: (item) => <span className="font-medium">{item.bookings}</span>,
    },
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
            <h1 className="text-2xl font-bold text-admin-text">Tours</h1>
            <p className="text-sm text-admin-muted mt-1">
              Manage all tours available on the platform.
            </p>
          </div>
          <Link href="/tours/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Tour
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStatus(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeStatus === tab
                  ? 'bg-white text-admin-text shadow-sm'
                  : 'text-admin-muted hover:text-admin-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filteredTours}
          searchPlaceholder="Search tours..."
          actions={(item) => (
            <div className="flex items-center gap-1">
              <Link
                href={`/tours/${item.id}`}
                className="p-1.5 text-admin-muted hover:text-ocean-500 rounded-lg hover:bg-gray-100"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button className="p-1.5 text-admin-muted hover:text-ocean-500 rounded-lg hover:bg-gray-100" title="View">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>
    </AdminLayout>
  );
}
