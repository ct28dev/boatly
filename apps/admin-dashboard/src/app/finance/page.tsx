'use client';

import { AdminLayout } from '@/components/ui/AdminLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { PieChartComponent } from '@/components/charts/PieChart';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  Download,
  FileText,
} from 'lucide-react';

interface Payout {
  id: string;
  provider: string;
  period: string;
  amount: number;
  bookings: number;
  commission: number;
  netAmount: number;
  status: string;
  paidDate: string;
  [key: string]: unknown;
}

const mockPayouts: Payout[] = [
  { id: 'PAY-001', provider: 'Sea Explorer Co.', period: 'Feb 2026', amount: 450000, bookings: 45, commission: 67500, netAmount: 382500, status: 'Completed', paidDate: '2026-03-05' },
  { id: 'PAY-002', provider: 'Island Hopper Tours', period: 'Feb 2026', amount: 280000, bookings: 32, commission: 42000, netAmount: 238000, status: 'Completed', paidDate: '2026-03-05' },
  { id: 'PAY-003', provider: 'Blue Horizon Marine', period: 'Feb 2026', amount: 520000, bookings: 58, commission: 78000, netAmount: 442000, status: 'Processing', paidDate: '-' },
  { id: 'PAY-004', provider: 'Andaman Adventures', period: 'Feb 2026', amount: 180000, bookings: 22, commission: 27000, netAmount: 153000, status: 'Processing', paidDate: '-' },
  { id: 'PAY-005', provider: 'Coral Bay Boats', period: 'Feb 2026', amount: 310000, bookings: 38, commission: 46500, netAmount: 263500, status: 'Pending', paidDate: '-' },
  { id: 'PAY-006', provider: 'Gulf Star Marine', period: 'Feb 2026', amount: 420000, bookings: 52, commission: 63000, netAmount: 357000, status: 'Completed', paidDate: '2026-03-05' },
  { id: 'PAY-007', provider: 'Phuket Sailing Club', period: 'Feb 2026', amount: 95000, bookings: 12, commission: 14250, netAmount: 80750, status: 'Pending', paidDate: '-' },
];

const paymentMethodData = [
  { name: 'Credit Card', value: 4500 },
  { name: 'Bank Transfer', value: 2100 },
  { name: 'PromptPay', value: 1800 },
  { name: 'PayPal', value: 650 },
  { name: 'Cash', value: 350 },
];

const monthlyComparison = [
  { month: 'Revenue', current: 7550000, previous: 6720000 },
  { month: 'Bookings', current: 1284, previous: 1186 },
  { month: 'Commission', current: 1132500, previous: 1008000 },
  { month: 'Avg. Booking', current: 5880, previous: 5665 },
];

export default function FinancePage() {
  const payoutColumns: Column<Payout>[] = [
    {
      key: 'id',
      label: 'Payout ID',
      render: (item) => (
        <span className="font-mono text-sm text-admin-muted">{item.id}</span>
      ),
    },
    { key: 'provider', label: 'Provider', sortable: true },
    { key: 'period', label: 'Period' },
    {
      key: 'amount',
      label: 'Gross Amount',
      sortable: true,
      render: (item) => <span className="font-medium">{formatCurrency(item.amount)}</span>,
    },
    {
      key: 'bookings',
      label: 'Bookings',
      render: (item) => <span>{item.bookings}</span>,
    },
    {
      key: 'commission',
      label: 'Commission (15%)',
      render: (item) => (
        <span className="text-ocean-500 font-medium">
          {formatCurrency(item.commission)}
        </span>
      ),
    },
    {
      key: 'netAmount',
      label: 'Net Payout',
      sortable: true,
      render: (item) => (
        <span className="font-semibold">{formatCurrency(item.netAmount)}</span>
      ),
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
            <h1 className="text-2xl font-bold text-admin-text">Finance</h1>
            <p className="text-sm text-admin-muted mt-1">
              Revenue overview, provider payouts, and financial reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Revenue"
            value="฿7.55M"
            change={12.3}
            icon={DollarSign}
            sparklineData={[32, 45, 52, 68, 89, 102, 78, 65]}
          />
          <StatsCard
            label="Commission Earned"
            value="฿1.13M"
            change={14.8}
            icon={TrendingUp}
            sparklineData={[15, 22, 25, 32, 38, 44, 40, 48]}
          />
          <StatsCard
            label="Avg. Transaction"
            value="฿5,880"
            change={3.8}
            icon={CreditCard}
            sparklineData={[50, 52, 54, 55, 56, 57, 58, 59]}
          />
          <StatsCard
            label="Pending Payouts"
            value="฿343K"
            change={-8.2}
            icon={Wallet}
            sparklineData={[60, 55, 50, 48, 42, 38, 35, 34]}
          />
        </div>

        {/* Revenue Chart + Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <PieChartComponent
            title="Payment Methods"
            subtitle="Transaction count by method"
            data={paymentMethodData}
          />
        </div>

        {/* Monthly Comparison */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-admin-text mb-4">
            Monthly Comparison
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {monthlyComparison.map((item) => {
              const change =
                ((item.current - item.previous) / item.previous) * 100;
              const isRevenue = item.month === 'Revenue' || item.month === 'Commission';
              const isCurrency = isRevenue || item.month === 'Avg. Booking';
              return (
                <div
                  key={item.month}
                  className="p-4 rounded-xl border border-admin-border"
                >
                  <p className="text-sm text-admin-muted">{item.month}</p>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-lg font-bold text-admin-text">
                        {isCurrency
                          ? formatCurrency(item.current)
                          : item.current.toLocaleString()}
                      </p>
                      <p className="text-xs text-admin-muted mt-0.5">
                        prev:{' '}
                        {isCurrency
                          ? formatCurrency(item.previous)
                          : item.previous.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        change >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}
                    >
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Provider Payouts */}
        <div>
          <h2 className="text-lg font-semibold text-admin-text mb-4">
            Provider Payouts — February 2026
          </h2>
          <DataTable
            columns={payoutColumns}
            data={mockPayouts}
            searchPlaceholder="Search payouts..."
          />
        </div>
      </div>
    </AdminLayout>
  );
}
