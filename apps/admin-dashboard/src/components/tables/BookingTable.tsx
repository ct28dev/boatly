'use client';

import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { Eye, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: string;
  customer: string;
  tour: string;
  date: string;
  status: string;
  amount: number;
  passengers: number;
  [key: string]: unknown;
}

const mockBookings: Booking[] = [
  { id: 'BK-001', customer: 'John Smith', tour: 'Phi Phi Island Day Trip', date: '2026-03-08', status: 'Confirmed', amount: 4500, passengers: 2 },
  { id: 'BK-002', customer: 'Sarah Johnson', tour: 'James Bond Island Tour', date: '2026-03-08', status: 'Pending', amount: 3200, passengers: 4 },
  { id: 'BK-003', customer: 'Michael Chen', tour: 'Similan Islands Diving', date: '2026-03-07', status: 'Confirmed', amount: 8900, passengers: 1 },
  { id: 'BK-004', customer: 'Emma Wilson', tour: 'Krabi 4 Islands Tour', date: '2026-03-07', status: 'Cancelled', amount: 2800, passengers: 3 },
  { id: 'BK-005', customer: 'David Lee', tour: 'Hong Island Sunset Tour', date: '2026-03-06', status: 'Confirmed', amount: 5600, passengers: 2 },
  { id: 'BK-006', customer: 'Lisa Anderson', tour: 'Phi Phi Island Day Trip', date: '2026-03-06', status: 'Pending', amount: 9000, passengers: 6 },
  { id: 'BK-007', customer: 'Robert Taylor', tour: 'Coral Island Snorkeling', date: '2026-03-05', status: 'Confirmed', amount: 3400, passengers: 2 },
  { id: 'BK-008', customer: 'Amy Garcia', tour: 'Rok Island Adventure', date: '2026-03-05', status: 'Confirmed', amount: 7200, passengers: 4 },
  { id: 'BK-009', customer: 'James Brown', tour: 'Koh Lipe Ferry Transfer', date: '2026-03-04', status: 'Pending', amount: 1800, passengers: 1 },
  { id: 'BK-010', customer: 'Nina Patel', tour: 'James Bond Island Tour', date: '2026-03-04', status: 'Confirmed', amount: 6400, passengers: 5 },
];

interface BookingTableProps {
  limit?: number;
  showActions?: boolean;
  headerActions?: React.ReactNode;
}

export function BookingTable({ limit, showActions = true, headerActions }: BookingTableProps) {
  const displayData = limit ? mockBookings.slice(0, limit) : mockBookings;

  const columns: Column<Booking>[] = [
    {
      key: 'id',
      label: 'Booking ID',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-sm font-medium text-ocean-500">{item.id}</span>
      ),
    },
    { key: 'customer', label: 'Customer', sortable: true },
    {
      key: 'tour',
      label: 'Tour',
      render: (item) => (
        <span className="max-w-[200px] truncate block">{item.tour}</span>
      ),
    },
    { key: 'date', label: 'Date', sortable: true },
    {
      key: 'passengers',
      label: 'PAX',
      render: (item) => <span>{item.passengers}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span className={getStatusColor(item.status)}>{item.status}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (item) => (
        <span className="font-medium">{formatCurrency(item.amount)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={displayData}
      searchPlaceholder="Search bookings..."
      pageSize={limit || 10}
      searchable={!limit}
      headerActions={headerActions}
      actions={
        showActions
          ? (item) => (
              <div className="flex items-center gap-1">
                <Link
                  href={`/bookings/${item.id}`}
                  className="p-1.5 text-admin-muted hover:text-ocean-500 rounded-lg hover:bg-gray-100"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                {item.status === 'Pending' && (
                  <>
                    <button
                      className="p-1.5 text-admin-muted hover:text-emerald-500 rounded-lg hover:bg-gray-100"
                      title="Approve"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-admin-muted hover:text-red-500 rounded-lg hover:bg-gray-100"
                      title="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )
          : undefined
      }
    />
  );
}
