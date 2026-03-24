'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronRight,
  Ticket,
  Heart,
  Star,
  Globe,
  Bell,
  HelpCircle,
  MessageSquare,
  LogOut,
  Camera,
  Settings,
  Shield,
  ArrowLeft,
} from 'lucide-react';

const user = {
  name: 'สมชาย ใจดี',
  email: 'somchai@email.com',
  phone: '081-234-5678',
  avatar: null,
  memberSince: 'สมาชิกตั้งแต่ มี.ค. 2568',
  stats: {
    trips: 12,
    reviews: 8,
    favorites: 5,
  },
};

const menuItems = [
  {
    label: 'ประวัติการจอง',
    desc: 'ดูการจองทั้งหมดของคุณ',
    icon: Ticket,
    href: '/profile/bookings',
    badge: '2',
  },
  {
    label: 'รายการโปรด',
    desc: 'ทริปที่คุณบันทึกไว้',
    icon: Heart,
    href: '/profile/favorites',
    badge: null,
  },
  {
    label: 'รีวิวของฉัน',
    desc: 'รีวิวที่คุณเขียน',
    icon: Star,
    href: '/reviews',
    badge: null,
  },
  {
    label: 'ภาษา',
    desc: 'ไทย',
    icon: Globe,
    href: '#',
    badge: null,
  },
  {
    label: 'การแจ้งเตือน',
    desc: 'จัดการการแจ้งเตือน',
    icon: Bell,
    href: '#',
    badge: '3',
  },
  {
    label: 'ความเห็น',
    desc: 'ส่งความคิดเห็นหรือข้อเสนอแนะ',
    icon: MessageSquare,
    href: '/profile/feedback',
    badge: null,
  },
  {
    label: 'ศูนย์ช่วยเหลือ',
    desc: 'ติดต่อสอบถามหรือแจ้งปัญหา',
    icon: HelpCircle,
    href: '/profile/help',
    badge: null,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="ocean-gradient pt-12 pb-20 px-5 relative overflow-hidden wave-bg">
        <div className="absolute top-4 left-4">
          <Link
            href="/home"
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
        </div>
        <div className="absolute top-4 right-4">
          <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="px-5 -mt-16 relative z-10 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-card p-5"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-ocean-400 to-ocean-700 flex items-center justify-center text-3xl text-white font-bold shadow-lg">
                {user.name.charAt(0)}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ocean-600 flex items-center justify-center border-2 border-white">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-ocean-600 mt-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user.memberSince}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'ทริป', value: user.stats.trips },
              { label: 'รีวิว', value: user.stats.reviews },
              { label: 'โปรด', value: user.stats.favorites },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center py-3 rounded-xl bg-ocean-50"
              >
                <p className="text-xl font-bold text-ocean-800">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Menu */}
      <div className="px-5">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-ocean-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-ocean-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full mt-4 py-3.5 rounded-2xl border border-red-200 text-red-500 font-semibold text-sm flex items-center justify-center gap-2 active:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </motion.button>

        <p className="text-center text-xs text-gray-400 mt-4">
          BOATLY v1.0.0
        </p>
      </div>
    </div>
  );
}
