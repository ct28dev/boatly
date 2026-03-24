'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Clock,
  Phone,
  Ship,
  Anchor,
  ChevronUp,
  ChevronDown,
  Waves,
  AlertCircle,
  CheckCircle2,
  Compass,
} from 'lucide-react';

const pierInfo = {
  name: 'ท่าเรืออ่าวปอ',
  address: '69 หมู่ 5 ต.อ่าวนาง อ.เมือง จ.กระบี่ 81000',
  phone: '075-123-456',
  lat: 8.0532,
  lng: 98.8366,
};

const boatStatus = {
  name: 'เรือ Sea Explorer',
  status: 'กำลังเข้าเทียบท่า',
  eta: 12,
  captain: 'กัปตันสมศักดิ์',
  capacity: 20,
  currentPassengers: 14,
};

export default function MapPage() {
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-100 relative overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="w-10 h-10 rounded-full glass flex items-center justify-center shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </Link>
          <div className="flex-1 glass rounded-2xl px-4 py-2.5 shadow-lg">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-ocean-600" />
              <span className="text-sm font-medium text-gray-900">
                {pierInfo.name}
              </span>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full glass flex items-center justify-center shadow-lg">
            <Compass className="w-5 h-5 text-gray-800" />
          </button>
        </div>
      </div>

      {/* Notification banner */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="absolute top-20 left-4 right-4 z-30"
          >
            <div className="bg-ocean-700 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Ship className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">
                  🚢 เรือกำลังเข้าเทียบท่า
                </p>
                <p className="text-xs text-white/80">
                  คาดว่าจะถึงใน {boatStatus.eta} นาที
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="p-1 text-white/60"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map placeholder */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-100 via-ocean-200 to-ocean-300">
          {/* Stylized map background */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 400 600">
              <path
                d="M0,200 Q100,180 200,200 Q300,220 400,200"
                fill="none"
                stroke="#0077b6"
                strokeWidth="1"
                opacity="0.5"
              />
              <path
                d="M0,250 Q100,230 200,250 Q300,270 400,250"
                fill="none"
                stroke="#0077b6"
                strokeWidth="1"
                opacity="0.3"
              />
              <path
                d="M0,300 Q100,280 200,300 Q300,320 400,300"
                fill="none"
                stroke="#0077b6"
                strokeWidth="1"
                opacity="0.3"
              />
              <circle cx="180" cy="280" r="60" fill="#0077b6" opacity="0.08" />
              <circle cx="300" cy="200" r="40" fill="#0077b6" opacity="0.06" />
              <circle cx="100" cy="350" r="30" fill="#0077b6" opacity="0.06" />
            </svg>
          </div>

          {/* Pier marker */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-4 rounded-full bg-ocean-500/20"
              />
              <div className="relative w-12 h-12 rounded-full bg-ocean-700 flex items-center justify-center shadow-xl border-3 border-white">
                <Anchor className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-xs font-bold text-ocean-800 bg-white/80 px-2 py-0.5 rounded-full shadow">
                  {pierInfo.name}
                </span>
              </div>
            </div>
          </div>

          {/* Boat marker (animated) */}
          <motion.div
            animate={{
              x: [0, -20, -10, -30],
              y: [0, 10, -5, 15],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute top-1/2 left-1/3"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -inset-3 rounded-full bg-emerald-400/20"
              />
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-white">
                <Ship className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>

          {/* User marker */}
          <div className="absolute bottom-1/3 right-1/4">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-3 rounded-full bg-blue-500/20"
              />
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg border-2 border-white">
                <Navigation className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Dashed route line (visual) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 400 600"
          >
            <path
              d="M260,400 Q200,350 180,300 Q160,250 150,200"
              fill="none"
              stroke="#0077b6"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* ETA badge */}
        <div className="absolute top-44 right-4 z-20">
          <div className="bg-white rounded-2xl shadow-lg px-4 py-3 text-center">
            <p className="text-xs text-gray-500">ETA</p>
            <p className="text-2xl font-bold text-ocean-800">
              {boatStatus.eta}
            </p>
            <p className="text-xs text-gray-500">นาที</p>
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <motion.div
        animate={{ height: sheetExpanded ? 340 : 180 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="bg-white rounded-t-3xl shadow-bottom-bar relative z-20 overflow-hidden"
      >
        {/* Handle */}
        <button
          onClick={() => setSheetExpanded(!sheetExpanded)}
          className="w-full flex justify-center pt-3 pb-2"
        >
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </button>

        <div className="px-5 pb-5 overflow-y-auto">
          {/* Status */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-ocean-50 flex items-center justify-center">
              <Ship className="w-6 h-6 text-ocean-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{boatStatus.name}</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-emerald-600 font-medium">
                  {boatStatus.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-ocean-800">
                {boatStatus.eta} <span className="text-sm font-normal">นาที</span>
              </p>
            </div>
          </div>

          {/* Pier info */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-ocean-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">
                  {pierInfo.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {pierInfo.address}
                </p>
              </div>
            </div>
          </div>

          {/* Expanded content */}
          {sheetExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex gap-3">
                <a
                  href={`tel:${pierInfo.phone}`}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  โทร
                </a>
                <button className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
                  <Navigation className="w-4 h-4" />
                  นำทาง
                </button>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">กัปตัน</span>
                  <span className="font-medium">{boatStatus.captain}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ผู้โดยสาร</span>
                  <span className="font-medium">
                    {boatStatus.currentPassengers}/{boatStatus.capacity} คน
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ocean-500 rounded-full"
                    style={{
                      width: `${(boatStatus.currentPassengers / boatStatus.capacity) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
