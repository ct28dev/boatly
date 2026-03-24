'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Users,
  SlidersHorizontal,
  ChevronDown,
  Heart,
  X,
  Anchor,
  ArrowLeft,
  Sailboat,
} from 'lucide-react';

const allTours = [
  {
    id: '1',
    name: 'เกาะเจมส์บอนด์ + เกาะปันหยี',
    location: 'พังงา',
    province: 'พังงา',
    boatType: 'สปีดโบท',
    image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400&h=300&fit=crop',
    price: 1500,
    originalPrice: 2000,
    rating: 4.8,
    reviewCount: 324,
    duration: '8 ชั่วโมง',
    durationHours: 8,
    capacity: 20,
  },
  {
    id: '2',
    name: 'ดำน้ำเกาะสิมิลัน',
    location: 'พังงา',
    province: 'พังงา',
    boatType: 'เรือใหญ่',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    price: 2800,
    originalPrice: 3500,
    rating: 4.9,
    reviewCount: 512,
    duration: 'Full Day',
    durationHours: 10,
    capacity: 30,
  },
  {
    id: '3',
    name: 'เรือหางยาวเกาะพีพี',
    location: 'กระบี่',
    province: 'กระบี่',
    boatType: 'เรือหางยาว',
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&h=300&fit=crop',
    price: 1200,
    originalPrice: 1800,
    rating: 4.7,
    reviewCount: 289,
    duration: '6 ชั่วโมง',
    durationHours: 6,
    capacity: 8,
  },
  {
    id: '4',
    name: 'Sunset Dinner Cruise พัทยา',
    location: 'ชลบุรี',
    province: 'ชลบุรี',
    boatType: 'เรือสำราญ',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=300&fit=crop',
    price: 3200,
    originalPrice: 4000,
    rating: 4.6,
    reviewCount: 178,
    duration: '3 ชั่วโมง',
    durationHours: 3,
    capacity: 50,
  },
  {
    id: '5',
    name: 'เรือคายัคอ่าวพังงา',
    location: 'พังงา',
    province: 'พังงา',
    boatType: 'คายัค',
    image: 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=400&h=300&fit=crop',
    price: 900,
    originalPrice: undefined,
    rating: 4.5,
    reviewCount: 156,
    duration: '4 ชั่วโมง',
    durationHours: 4,
    capacity: 2,
  },
  {
    id: '6',
    name: 'ตกปลา + ดำน้ำ เกาะล้าน',
    location: 'ชลบุรี',
    province: 'ชลบุรี',
    boatType: 'สปีดโบท',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
    price: 1800,
    originalPrice: undefined,
    rating: 4.4,
    reviewCount: 98,
    duration: '6 ชั่วโมง',
    durationHours: 6,
    capacity: 12,
  },
];

const locations = ['ทั้งหมด', 'พังงา', 'กระบี่', 'ชลบุรี', 'ภูเก็ต', 'สุราษฎร์ธานี'];
const boatTypes = ['ทั้งหมด', 'สปีดโบท', 'เรือหางยาว', 'เรือใหญ่', 'เรือสำราญ', 'คายัค'];

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-card">
      <div className="h-40 shimmer" />
      <div className="p-3.5 space-y-2">
        <div className="h-3 w-16 shimmer rounded" />
        <div className="h-4 w-3/4 shimmer rounded" />
        <div className="h-3 w-1/2 shimmer rounded" />
        <div className="flex justify-between">
          <div className="h-5 w-20 shimmer rounded" />
          <div className="h-4 w-12 shimmer rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ToursPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ทั้งหมด');
  const [selectedBoatType, setSelectedBoatType] = useState('ทั้งหมด');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [isLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filteredTours = allTours.filter((tour) => {
    if (selectedLocation !== 'ทั้งหมด' && tour.province !== selectedLocation)
      return false;
    if (selectedBoatType !== 'ทั้งหมด' && tour.boatType !== selectedBoatType)
      return false;
    if (tour.price < priceRange[0] || tour.price > priceRange[1]) return false;
    if (
      searchQuery &&
      !tour.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !tour.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/home" className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาทริป..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl transition-colors ${showFilters ? 'bg-ocean-700 text-white' : 'bg-gray-50 text-gray-600'}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Location pills */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 px-4 pb-3">
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => setSelectedLocation(loc)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedLocation === loc
                  ? 'bg-ocean-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white border-b border-gray-100"
          >
            <div className="px-4 py-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  ประเภทเรือ
                </h4>
                <div className="flex flex-wrap gap-2">
                  {boatTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedBoatType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedBoatType === type
                          ? 'bg-ocean-700 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  ช่วงราคา: ฿{priceRange[0].toLocaleString()} - ฿
                  {priceRange[1].toLocaleString()}
                </h4>
                <input
                  type="range"
                  min={0}
                  max={5000}
                  step={100}
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  className="w-full accent-ocean-700"
                />
              </div>

              <button
                onClick={() => {
                  setSelectedLocation('ทั้งหมด');
                  setSelectedBoatType('ทั้งหมด');
                  setPriceRange([0, 5000]);
                }}
                className="text-sm text-ocean-600 font-medium"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          พบ{' '}
          <span className="font-semibold text-gray-900">
            {filteredTours.length}
          </span>{' '}
          ทริป
        </p>
        <button className="flex items-center gap-1 text-sm text-gray-600">
          เรียงตาม <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Tour Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredTours.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 px-8"
        >
          <div className="w-20 h-20 rounded-full bg-ocean-50 flex items-center justify-center mb-4">
            <Anchor className="w-10 h-10 text-ocean-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            ไม่พบทริป
          </h3>
          <p className="text-sm text-gray-500 text-center">
            ลองเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น
          </p>
          <button
            onClick={() => {
              setSelectedLocation('ทั้งหมด');
              setSelectedBoatType('ทั้งหมด');
              setSearchQuery('');
              setPriceRange([0, 5000]);
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-ocean-700 text-white text-sm font-semibold"
          >
            ล้างตัวกรอง
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {filteredTours.map((tour, i) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/tours/${tour.id}`} className="block group">
                <div className="rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-shadow duration-300">
                  <div className="relative h-36 overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                      style={{ backgroundImage: `url(${tour.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {tour.originalPrice && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        -{Math.round((1 - tour.price / tour.originalPrice) * 100)}%
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(tour.id);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full glass flex items-center justify-center"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${
                          favorites.has(tour.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-white'
                        }`}
                      />
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
        </div>
      )}
    </div>
  );
}
