'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Star,
  Clock,
  Users,
  Anchor,
} from 'lucide-react';

const favoriteTours = [
  {
    id: '1',
    name: 'เกาะเจมส์บอนด์ + เกาะปันหยี',
    location: 'พังงา',
    image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400&h=300&fit=crop',
    price: 1500,
    rating: 4.8,
    reviewCount: 324,
    duration: '8 ชั่วโมง',
  },
  {
    id: '2',
    name: 'ดำน้ำเกาะสิมิลัน',
    location: 'พังงา',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    price: 2800,
    rating: 4.9,
    reviewCount: 512,
    duration: 'Full Day',
  },
  {
    id: '3',
    name: 'Sunset Dinner Cruise พัทยา',
    location: 'ชลบุรี',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=300&fit=crop',
    price: 3200,
    rating: 4.6,
    reviewCount: 178,
    duration: '3 ชั่วโมง',
  },
  {
    id: '4',
    name: 'เรือสปีดโบท เกาะเต่า',
    location: 'สุราษฎร์ธานี',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    price: 2200,
    rating: 4.7,
    reviewCount: 215,
    duration: 'Full Day',
  },
];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(favoriteTours.map((t) => t.id))
  );

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleTours = favoriteTours.filter((t) => favorites.has(t.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">รายการโปรด</h1>
          <span className="text-sm text-gray-400 ml-auto">
            {visibleTours.length} รายการ
          </span>
        </div>
      </div>

      <div className="px-4 py-4">
        {visibleTours.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-red-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              ยังไม่มีรายการโปรด
            </h3>
            <p className="text-sm text-gray-500 text-center">
              กดไอคอนหัวใจเพื่อบันทึกทริปที่ชอบ
            </p>
            <Link
              href="/tours"
              className="mt-4 px-6 py-2.5 rounded-xl bg-ocean-700 text-white text-sm font-semibold"
            >
              สำรวจทริป
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {visibleTours.map((tour, i) => (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <Link href={`/tours/${tour.id}`} className="block group">
                    <div className="rounded-2xl overflow-hidden bg-white shadow-card">
                      <div className="relative h-36 overflow-hidden">
                        <div
                          className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                          style={{ backgroundImage: `url(${tour.image})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(tour.id);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center"
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-1 text-[11px] text-ocean-600 mb-0.5">
                          <MapPin className="w-3 h-3" />
                          {tour.location}
                        </div>
                        <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-1.5 leading-snug">
                          {tour.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {tour.duration}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-ocean-700">
                            ฿{tour.price.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-[11px] font-semibold">
                              {tour.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
