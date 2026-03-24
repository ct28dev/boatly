'use client';

import { AdminLayout } from '@/components/ui/AdminLayout';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Printer,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

const bookingDetail = {
  id: 'BK-001',
  status: 'Confirmed',
  createdAt: '2026-03-06 14:23',
  customer: {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+66 82 345 6789',
    nationality: 'British',
  },
  tour: {
    name: 'Phi Phi Island Day Trip',
    provider: 'Sea Explorer Co.',
    date: '2026-03-08',
    time: '07:30',
    departurePier: 'Rassada Pier, Phuket',
    duration: '8 hours',
  },
  passengers: [
    { name: 'John Smith', type: 'Adult', price: 2500 },
    { name: 'Jane Smith', type: 'Adult', price: 2500 },
  ],
  payment: {
    subtotal: 5000,
    discount: 500,
    serviceFee: 250,
    total: 4750,
    method: 'Credit Card',
    cardLast4: '4242',
    paidAt: '2026-03-06 14:25',
    transactionId: 'TXN-20260306-001',
  },
  timeline: [
    { time: '2026-03-06 14:23', event: 'Booking created', status: 'completed' },
    { time: '2026-03-06 14:25', event: 'Payment received', status: 'completed' },
    { time: '2026-03-06 14:25', event: 'Booking confirmed', status: 'completed' },
    { time: '2026-03-06 14:30', event: 'Confirmation email sent', status: 'completed' },
    { time: '2026-03-08 07:30', event: 'Tour departure', status: 'upcoming' },
  ],
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/bookings"
              className="p-2 rounded-lg hover:bg-gray-100 text-admin-muted hover:text-admin-text"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-admin-text">Booking {id}</h1>
                <span className={getStatusColor(bookingDetail.status)}>
                  {bookingDetail.status}
                </span>
              </div>
              <p className="text-sm text-admin-muted mt-0.5">
                Created: {bookingDetail.createdAt}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2 text-sm">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button className="btn-secondary flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4" />
              Resend Email
            </button>
            {bookingDetail.status === 'Pending' && (
              <>
                <button className="btn-primary flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button className="btn-danger flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-admin-text mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-ocean-500" />
                Customer Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-admin-muted uppercase tracking-wide">Name</p>
                  <p className="text-sm font-medium text-admin-text mt-1">
                    {bookingDetail.customer.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-admin-muted uppercase tracking-wide">Email</p>
                  <p className="text-sm text-admin-text mt-1">{bookingDetail.customer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-admin-muted uppercase tracking-wide">Phone</p>
                  <p className="text-sm text-admin-text mt-1">{bookingDetail.customer.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-admin-muted uppercase tracking-wide">Nationality</p>
                  <p className="text-sm text-admin-text mt-1">{bookingDetail.customer.nationality}</p>
                </div>
              </div>
            </div>

            {/* Tour Info */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-admin-text mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-ocean-500" />
                Tour Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-xs text-admin-muted uppercase tracking-wide">Tour</p>
                  <p className="text-sm font-medium text-admin-text mt-1">
                    {bookingDetail.tour.name}
                  </p>
                  <p className="text-xs text-admin-muted">{bookingDetail.tour.provider}</p>
                </div>
                <div>
                  <p className="text-xs text-admin-muted uppercase tracking-wide">Date</p>
                  <p className="text-sm text-admin-text mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-admin-muted" />
                    {bookingDetail.tour.date}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-admin-muted uppercase tracking-wide">Time</p>
                  <p className="text-sm text-admin-text mt-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-admin-muted" />
                    {bookingDetail.tour.time}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-admin-muted uppercase tracking-wide">Departure</p>
                  <p className="text-sm text-admin-text mt-1">{bookingDetail.tour.departurePier}</p>
                </div>
                <div>
                  <p className="text-xs text-admin-muted uppercase tracking-wide">Duration</p>
                  <p className="text-sm text-admin-text mt-1">{bookingDetail.tour.duration}</p>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-admin-border flex items-center gap-2">
                <Users className="w-5 h-5 text-ocean-500" />
                <h2 className="text-lg font-semibold text-admin-text">
                  Passengers ({bookingDetail.passengers.length})
                </h2>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingDetail.passengers.map((p, i) => (
                    <tr key={i}>
                      <td className="font-medium">{p.name}</td>
                      <td>{p.type}</td>
                      <td>{formatCurrency(p.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right - Payment & Timeline */}
          <div className="space-y-6">
            {/* Payment */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-admin-text mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-ocean-500" />
                Payment
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-admin-muted">Subtotal</span>
                  <span className="text-admin-text">
                    {formatCurrency(bookingDetail.payment.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-admin-muted">Discount</span>
                  <span className="text-emerald-500">
                    -{formatCurrency(bookingDetail.payment.discount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-admin-muted">Service Fee</span>
                  <span className="text-admin-text">
                    {formatCurrency(bookingDetail.payment.serviceFee)}
                  </span>
                </div>
                <div className="border-t border-admin-border pt-3 flex justify-between">
                  <span className="font-semibold text-admin-text">Total</span>
                  <span className="font-bold text-lg text-ocean-500">
                    {formatCurrency(bookingDetail.payment.total)}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-admin-muted">Method</span>
                  <span className="text-admin-text">
                    {bookingDetail.payment.method} ****{bookingDetail.payment.cardLast4}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-admin-muted">Transaction</span>
                  <span className="text-admin-text font-mono">
                    {bookingDetail.payment.transactionId}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-admin-muted">Paid at</span>
                  <span className="text-admin-text">{bookingDetail.payment.paidAt}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-admin-text mb-4">Timeline</h2>
              <div className="space-y-0">
                {bookingDetail.timeline.map((item, i) => (
                  <div key={i} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          item.status === 'completed'
                            ? 'bg-emerald-500'
                            : 'bg-gray-300 ring-4 ring-gray-100'
                        }`}
                      />
                      {i < bookingDetail.timeline.length - 1 && (
                        <div className="w-px h-full bg-admin-border mt-1" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-medium text-admin-text">{item.event}</p>
                      <p className="text-xs text-admin-muted mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
