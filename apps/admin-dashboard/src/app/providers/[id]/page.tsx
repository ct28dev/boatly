'use client';

import { AdminLayout } from '@/components/ui/AdminLayout';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Ship,
  Map,
  DollarSign,
  Calendar,
  ArrowLeft,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

const providerDetail = {
  id: 'PRV-001',
  company: 'Sea Explorer Co.',
  companyTh: 'บริษัท ซี เอ็กซ์พลอเรอร์ จำกัด',
  contact: 'Somchai Kittisakul',
  email: 'info@seaexplorer.th',
  phone: '+66 76 123 456',
  address: '45/12 Chalong Bay Road, Muang, Phuket 83130',
  taxId: '0105562012345',
  status: 'Active',
  joinDate: '2025-06-15',
  totalRevenue: 2450000,
  monthlyRevenue: 320000,
  boats: [
    { id: 'BT-001', name: 'Sea Breeze I', type: 'Speedboat', capacity: 30, status: 'Active' },
    { id: 'BT-002', name: 'Ocean Star', type: 'Catamaran', capacity: 50, status: 'Active' },
    { id: 'BT-003', name: 'Wave Runner', type: 'Speedboat', capacity: 25, status: 'Active' },
    { id: 'BT-004', name: 'Island Cruiser', type: 'Ferry', capacity: 80, status: 'Maintenance' },
    { id: 'BT-005', name: 'Sunset Dream', type: 'Yacht', capacity: 12, status: 'Active' },
  ],
  tours: [
    { id: 'TR-001', name: 'Phi Phi Island Day Trip', price: 2500, bookings: 145, status: 'Active' },
    { id: 'TR-002', name: 'James Bond Island Tour', price: 3200, bookings: 98, status: 'Active' },
    { id: 'TR-003', name: 'Similan Islands Diving', price: 4500, bookings: 67, status: 'Active' },
    { id: 'TR-004', name: 'Krabi Sunset Cruise', price: 1800, bookings: 52, status: 'Active' },
    { id: 'TR-005', name: 'Coral Island Snorkeling', price: 1500, bookings: 112, status: 'Active' },
    { id: 'TR-006', name: 'Koh Lipe Express', price: 3800, bookings: 34, status: 'Draft' },
    { id: 'TR-007', name: 'Racha Island Premium', price: 5500, bookings: 28, status: 'Active' },
    { id: 'TR-008', name: 'Phang Nga Bay Explorer', price: 2800, bookings: 89, status: 'Active' },
  ],
};

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/providers"
              className="p-2 rounded-lg hover:bg-gray-100 text-admin-muted hover:text-admin-text"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-admin-text">
                  {providerDetail.company}
                </h1>
                <span className={getStatusColor(providerDetail.status)}>
                  {providerDetail.status}
                </span>
              </div>
              <p className="text-sm text-admin-muted mt-0.5">
                {providerDetail.companyTh} &bull; ID: {id}
              </p>
            </div>
          </div>
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <Edit className="w-4 h-4" />
            Edit Provider
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { icon: Ship, label: 'Total Boats', value: providerDetail.boats.length },
            { icon: Map, label: 'Total Tours', value: providerDetail.tours.length },
            { icon: DollarSign, label: 'Total Revenue', value: formatCurrency(providerDetail.totalRevenue) },
            { icon: Calendar, label: 'Joined', value: providerDetail.joinDate },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-ocean-50 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-ocean-500" />
              </div>
              <div>
                <p className="text-xs text-admin-muted">{stat.label}</p>
                <p className="text-lg font-semibold text-admin-text">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info + Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-admin-text mb-4">Company Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-admin-muted mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-admin-text">{providerDetail.company}</p>
                  <p className="text-sm text-admin-muted">Tax ID: {providerDetail.taxId}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-admin-muted mt-0.5" />
                <p className="text-sm text-admin-muted">{providerDetail.address}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-admin-text mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-ocean-50 flex items-center justify-center text-ocean-500 text-sm font-semibold">
                  {providerDetail.contact.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-admin-text">{providerDetail.contact}</p>
                  <p className="text-xs text-admin-muted">Primary Contact</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-admin-muted" />
                <p className="text-sm text-admin-muted">{providerDetail.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-admin-muted" />
                <p className="text-sm text-admin-muted">{providerDetail.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Boats */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-admin-border">
            <h2 className="text-lg font-semibold text-admin-text">Boats</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {providerDetail.boats.map((boat) => (
                <tr key={boat.id}>
                  <td className="font-mono text-sm text-admin-muted">{boat.id}</td>
                  <td className="font-medium">{boat.name}</td>
                  <td>{boat.type}</td>
                  <td>{boat.capacity} pax</td>
                  <td>
                    <span className={getStatusColor(boat.status)}>{boat.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tours */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-admin-border">
            <h2 className="text-lg font-semibold text-admin-text">Tours</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tour Name</th>
                <th>Price</th>
                <th>Bookings</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {providerDetail.tours.map((tour) => (
                <tr key={tour.id}>
                  <td className="font-mono text-sm text-admin-muted">{tour.id}</td>
                  <td className="font-medium">{tour.name}</td>
                  <td>{formatCurrency(tour.price)}</td>
                  <td>{tour.bookings}</td>
                  <td>
                    <span className={getStatusColor(tour.status)}>{tour.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
