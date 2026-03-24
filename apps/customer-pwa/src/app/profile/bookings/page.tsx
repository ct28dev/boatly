'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  ChevronRight,
  Ship,
  Ticket,
} from 'lucide-react';

type BookingStatus = 'all' | 'upcoming' | 'completed' | 'cancelled';

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  upcoming: { label: 'กำลังจะมาถึง', color: 'text-ocean-700', bg: 'bg-ocean-100' },
  confirmed: { label: 'ยืนยันแล้ว', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  completed: { label: 'เสร็จสิ้น', color: 'text-gray-600', bg: 'bg-gray-100' },
  cancelled: { label: 'ยกเลิก', color: 'text-red-600', bg: 'bg-red-100' },
};

const bookings = [
  {
    id: 'BH-2569-03-00142',
    tourName: 'เกาะเจมส์บอนด์ + เกาะปันหยี',
    image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=300&h=200&fit=crop',
    date: '15 มี.ค. 2569',
    time: '09:00 น.',
    passengers: 3,
    price: 3900,
    status: 'upcoming',
    location: 'อ่าวพังงา',
  },
  {
    id: 'BH-2569-02-00098',
    tourName: 'Sunset Dinner Cruise พัทยา',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=300&h=200&fit=crop',
    date: '28 ก.พ. 2569',
    time: '16:00 น.',
    passengers: 2,
    price: 6400,
    status: 'upcoming',
    location: 'พัทยา',
  },
  {
    id: 'BH-2569-01-00065',
    tourName: 'ดำน้ำเกาะสิมิลัน',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=200&fit=crop',
    date: '10 ม.ค. 2569',
    time: '08:00 น.',
    passengers: 4,
    price: 11200,
    status: 'completed',
    location: 'พังงา',
  },
  {
    id: 'BH-2568-12-00044',
    tourName: 'เรือหางยาวเกาะพีพี',
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=300&h=200&fit=crop',
    date: '20 ธ.ค. 2568',
    time: '09:00 น.',
    passengers: 2,
    price: 2400,
    status: 'completed',
    location: 'กระบี่',
  },
  {
    id: 'BH-2568-11-00023',
    tourName: 'เรือคายัคอ่าวพังงา',
    image: 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=300&h=200&fit=crop',
    date: '5 พ.ย. 2568',
    time: '13:00 น.',
    passengers: 2,
    price: 1800,
    status: 'cancelled',
    location: 'พังงา',
  },
];

const tabs: { id: BookingStatus; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'upcoming', label: 'กำลังมาถึง' },
  { id: 'completed', label: 'เสร็จสิ้น' },
  { id: 'cancelled', label: 'ยกเลิก' },
];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingStatus>('all');

  const filteredBookings = bookings.filter(
    (b) => activeTab === 'all' || b.status === activeTab
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/profile" className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">ประวัติการจอง</h1>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 pb-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-ocean-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Booking list */}
      <div className="px-4 py-4">
        {filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-ocean-50 flex items-center justify-center mb-4">
              <Ticket className="w-10 h-10 text-ocean-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              ไม่มีการจอง
            </h3>
            <p className="text-sm text-gray-500 text-center">
              ยังไม่มีการจองในหมวดนี้
            </p>
            <Link
              href="/tours"
              className="mt-4 px-6 py-2.5 rounded-xl bg-ocean-700 text-white text-sm font-semibold"
            >
              ค้นหาทริป
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredBookings.map((booking, i) => {
                const status = statusConfig[booking.status];
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/tours/${booking.id}`}
                      className="block bg-white rounded-2xl shadow-card overflow-hidden active:scale-[0.98] transition-transform"
                    >
                      <div className="flex gap-3 p-4">
                        <div
                          className="w-24 h-24 rounded-xl bg-cover bg-center flex-shrink-0"
                          style={{
                            backgroundImage: `url(${booking.image})`,
                          }}
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.color}`}
                              >
                                {status.label}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {booking.id}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
                              {booking.tourName}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {booking.location}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {booking.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {booking.passengers} คน
                              </span>
                            </div>
                            <span className="text-sm font-bold text-ocean-700">
                              ฿{booking.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
