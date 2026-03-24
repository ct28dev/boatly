'use client';

import { DataTable, type Column } from '@/components/ui/DataTable';
import { getStatusColor } from '@/lib/utils';
import { Eye, CheckCircle, Ban, Building2 } from 'lucide-react';
import Link from 'next/link';

interface Provider {
  id: string;
  company: string;
  contact: string;
  email: string;
  status: string;
  boats: number;
  tours: number;
  joinDate: string;
  [key: string]: unknown;
}

export const mockProviders: Provider[] = [
  { id: 'PRV-001', company: 'Sea Explorer Co.', contact: 'Somchai K.', email: 'info@seaexplorer.th', status: 'Active', boats: 5, tours: 8, joinDate: '2025-06-15' },
  { id: 'PRV-002', company: 'Island Hopper Tours', contact: 'Napat W.', email: 'book@islandhopper.com', status: 'Active', boats: 3, tours: 5, joinDate: '2025-08-22' },
  { id: 'PRV-003', company: 'Andaman Adventures', contact: 'Prayut S.', email: 'hello@andaman.th', status: 'Pending', boats: 2, tours: 3, joinDate: '2026-01-10' },
  { id: 'PRV-004', company: 'Blue Horizon Marine', contact: 'Wichai T.', email: 'ops@bluehorizon.co.th', status: 'Active', boats: 7, tours: 12, joinDate: '2025-03-05' },
  { id: 'PRV-005', company: 'Thai Sea Cruises', contact: 'Arun P.', email: 'info@thaiseacruises.com', status: 'Suspended', boats: 4, tours: 0, joinDate: '2025-09-18' },
  { id: 'PRV-006', company: 'Coral Bay Boats', contact: 'Manee L.', email: 'coral@bayboats.th', status: 'Active', boats: 2, tours: 4, joinDate: '2025-11-30' },
  { id: 'PRV-007', company: 'Phuket Sailing Club', contact: 'Kittisak R.', email: 'sail@phuketsailing.com', status: 'Pending', boats: 1, tours: 2, joinDate: '2026-02-14' },
  { id: 'PRV-008', company: 'Gulf Star Marine', contact: 'Sumet C.', email: 'info@gulfstar.th', status: 'Active', boats: 6, tours: 9, joinDate: '2025-04-20' },
];

interface ProviderTableProps {
  statusFilter?: string;
  headerActions?: React.ReactNode;
}

export function ProviderTable({ statusFilter, headerActions }: ProviderTableProps) {
  const displayData = statusFilter && statusFilter !== 'all'
    ? mockProviders.filter((p) => p.status.toLowerCase() === statusFilter.toLowerCase())
    : mockProviders;

  const columns: Column<Provider>[] = [
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-ocean-50 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-ocean-500" />
          </div>
          <div>
            <p className="font-medium text-admin-text">{item.company}</p>
            <p className="text-xs text-admin-muted">{item.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'contact', label: 'Contact Person', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span className={getStatusColor(item.status)}>{item.status}</span>
      ),
    },
    {
      key: 'boats',
      label: 'Boats',
      sortable: true,
      render: (item) => <span className="font-medium">{item.boats}</span>,
    },
    {
      key: 'tours',
      label: 'Tours',
      sortable: true,
      render: (item) => <span className="font-medium">{item.tours}</span>,
    },
    { key: 'joinDate', label: 'Joined', sortable: true },
  ];

  return (
    <DataTable
      columns={columns}
      data={displayData}
      searchPlaceholder="Search providers..."
      headerActions={headerActions}
      actions={(item) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/providers/${item.id}`}
            className="p-1.5 text-admin-muted hover:text-ocean-500 rounded-lg hover:bg-gray-100"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Link>
          {item.status === 'Pending' && (
            <button
              className="p-1.5 text-admin-muted hover:text-emerald-500 rounded-lg hover:bg-gray-100"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {item.status === 'Active' && (
            <button
              className="p-1.5 text-admin-muted hover:text-red-500 rounded-lg hover:bg-gray-100"
              title="Suspend"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    />
  );
}
