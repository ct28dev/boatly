'use client';

import { DataTable, type Column } from '@/components/ui/DataTable';
import { getStatusColor } from '@/lib/utils';
import { CheckCircle, XCircle, Star } from 'lucide-react';

interface Review {
  id: string;
  user: string;
  tour: string;
  rating: number;
  excerpt: string;
  status: string;
  date: string;
  [key: string]: unknown;
}

const mockReviews: Review[] = [
  { id: 'RV-001', user: 'John Smith', tour: 'Phi Phi Island Day Trip', rating: 5, excerpt: 'Amazing experience! The crew was very professional and the islands were beautiful.', status: 'Approved', date: '2026-03-08' },
  { id: 'RV-002', user: 'Emma Wilson', tour: 'James Bond Island Tour', rating: 4, excerpt: 'Great tour overall. The lunch could have been better but the scenery was incredible.', status: 'Pending', date: '2026-03-07' },
  { id: 'RV-003', user: 'Michael Chen', tour: 'Similan Islands Diving', rating: 5, excerpt: 'Best diving experience in Thailand! Crystal clear water and amazing marine life.', status: 'Approved', date: '2026-03-07' },
  { id: 'RV-004', user: 'Sarah Johnson', tour: 'Krabi 4 Islands Tour', rating: 2, excerpt: 'Very disappointing. The boat was overcrowded and we had to wait a long time.', status: 'Pending', date: '2026-03-06' },
  { id: 'RV-005', user: 'David Lee', tour: 'Hong Island Sunset Tour', rating: 5, excerpt: 'Unforgettable sunset! The kayaking was a highlight. Highly recommended.', status: 'Approved', date: '2026-03-06' },
  { id: 'RV-006', user: 'Lisa Anderson', tour: 'Coral Island Snorkeling', rating: 1, excerpt: 'Terrible service. The guide did not speak English and we felt unsafe.', status: 'Rejected', date: '2026-03-05' },
  { id: 'RV-007', user: 'Robert Taylor', tour: 'Rok Island Adventure', rating: 4, excerpt: 'Beautiful island with great snorkeling spots. The speedboat ride was quite rough though.', status: 'Pending', date: '2026-03-05' },
  { id: 'RV-008', user: 'Amy Garcia', tour: 'Phi Phi Island Day Trip', rating: 3, excerpt: 'Average experience. Too many tourists and not enough time at each stop.', status: 'Approved', date: '2026-03-04' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

interface ReviewTableProps {
  statusFilter?: string;
  headerActions?: React.ReactNode;
}

export function ReviewTable({ statusFilter, headerActions }: ReviewTableProps) {
  const displayData = statusFilter && statusFilter !== 'all'
    ? mockReviews.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase())
    : mockReviews;

  const columns: Column<Review>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (item) => (
        <span className="font-mono text-sm text-admin-muted">{item.id}</span>
      ),
    },
    { key: 'user', label: 'User', sortable: true },
    {
      key: 'tour',
      label: 'Tour',
      render: (item) => (
        <span className="max-w-[180px] truncate block">{item.tour}</span>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (item) => <StarRating rating={item.rating} />,
    },
    {
      key: 'excerpt',
      label: 'Review',
      render: (item) => (
        <span className="max-w-[250px] truncate block text-admin-muted text-sm">
          {item.excerpt}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span className={getStatusColor(item.status)}>{item.status}</span>
      ),
    },
    { key: 'date', label: 'Date', sortable: true },
  ];

  return (
    <DataTable
      columns={columns}
      data={displayData}
      searchPlaceholder="Search reviews..."
      headerActions={headerActions}
      actions={(item) => (
        <div className="flex items-center gap-1">
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
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    />
  );
}
