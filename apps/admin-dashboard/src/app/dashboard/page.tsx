'use client';

import { AdminLayout } from '@/components/ui/AdminLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { BookingChart } from '@/components/charts/BookingChart';
import { PieChartComponent } from '@/components/charts/PieChart';
import { BookingTable } from '@/components/tables/BookingTable';
import {
  DollarSign,
  CalendarCheck,
  Map,
  Users,
  Plus,
  Ship,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-admin-text">Dashboard</h1>
            <p className="text-sm text-admin-muted mt-1">
              Welcome back! Here&apos;s what&apos;s happening with BOATLY.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/tours/new" className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Add Tour
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Revenue"
            value="฿7.55M"
            change={12.5}
            icon={DollarSign}
            sparklineData={[32, 45, 52, 68, 89, 102, 78, 65, 58, 72, 43, 51]}
          />
          <StatsCard
            label="Total Bookings"
            value="1,284"
            change={8.2}
            icon={CalendarCheck}
            sparklineData={[40, 55, 48, 62, 58, 72, 68, 80, 74, 88, 92, 96]}
          />
          <StatsCard
            label="Active Tours"
            value="43"
            change={5.1}
            icon={Map}
            sparklineData={[30, 32, 33, 35, 36, 38, 37, 39, 40, 41, 42, 43]}
          />
          <StatsCard
            label="New Users"
            value="256"
            change={-3.4}
            icon={Users}
            sparklineData={[42, 38, 45, 40, 35, 32, 30, 28, 25, 27, 24, 22]}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <BookingChart />
        </div>

        {/* Recent Bookings + Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-admin-text">Recent Bookings</h2>
              <Link
                href="/bookings"
                className="text-sm text-ocean-500 hover:text-ocean-600 font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <BookingTable limit={5} showActions={false} />
          </div>
          <PieChartComponent
            title="Bookings by Boat Type"
            subtitle="Current month distribution"
          />
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-admin-text mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/tours/new"
              className="flex items-center gap-4 p-4 rounded-xl border border-admin-border hover:border-ocean-500 hover:bg-ocean-50/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-ocean-50 flex items-center justify-center group-hover:bg-ocean-100 transition-colors">
                <Map className="w-6 h-6 text-ocean-500" />
              </div>
              <div>
                <p className="font-medium text-admin-text">Add New Tour</p>
                <p className="text-sm text-admin-muted">Create a new tour listing</p>
              </div>
            </Link>
            <Link
              href="/boats"
              className="flex items-center gap-4 p-4 rounded-xl border border-admin-border hover:border-ocean-500 hover:bg-ocean-50/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Ship className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium text-admin-text">Add New Boat</p>
                <p className="text-sm text-admin-muted">Register a new vessel</p>
              </div>
            </Link>
            <Link
              href="/bookings"
              className="flex items-center gap-4 p-4 rounded-xl border border-admin-border hover:border-ocean-500 hover:bg-ocean-50/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <CalendarCheck className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-admin-text">View Bookings</p>
                <p className="text-sm text-admin-muted">Manage all bookings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
