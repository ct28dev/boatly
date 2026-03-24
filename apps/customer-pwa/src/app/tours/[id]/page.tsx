'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  Clock,
  Users,
  MapPin,
  ChevronRight,
  Shield,
  Check,
  Calendar,
  Anchor,
  Ship,
  Camera,
  ThumbsUp,
} from 'lucide-react';

const tourData = {
  id: '1',
  name: 'เกาะเจมส์บอนด์ + เกาะปันหยี วันเดียวเที่ยวครบ',
  location: 'อ่าวพังงา, พังงา',
  images: [
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&h=500&fit=crop',
  ],
  price: 1500,
  originalPrice: 2000,
  rating: 4.8,
  reviewCount: 324,
  duration: '8 ชั่วโมง',
  capacity: 20,
  boatType: 'สปีดโบท',
  provider: 'Phang Nga Bay Tours',
  description:
    'สัมผัสประสบการณ์สุดพิเศษกับทริปเกาะเจมส์บอนด์และเกาะปันหยี ล่องเรือสปีดโบทชมวิวอ่าวพังงาที่งดงาม แวะเที่ยวเกาะเจมส์บอนด์ถ่ายรูปกับหินตะปู ไอคอนิคของจังหวัดพังงา จากนั้นเดินทางไปเกาะปันหยี หมู่บ้านชาวประมงกลางทะเล ชิมอาหารทะเลสดๆ ชมวิถีชีวิตชาวเลดั้งเดิม พร้อมแวะพักผ่อนที่เกาะนาคาน้อย ดำน้ำชมปะการังน้ำตื้นสุดสวย',
  highlights: [
    'เรือสปีดโบทปรับอากาศ',
    'อาหารกลางวัน + ของว่าง',
    'อุปกรณ์ดำน้ำตื้น',
    'ประกันภัยการเดินทาง',
    'รับ-ส่ง โรงแรมในภูเก็ต',
    'ไกด์นำเที่ยวมืออาชีพ',
  ],
  schedule: [
    { time: '07:30', desc: 'รับจากโรงแรม' },
    { time: '08:30', desc: 'ออกเดินทางจากท่าเรือ' },
    { time: '09:30', desc: 'เกาะเจมส์บอนด์ - ถ่ายรูป ชมวิว' },
    { time: '11:00', desc: 'เกาะปันหยี - อาหารกลางวัน' },
    { time: '13:00', desc: 'เกาะนาคาน้อย - ดำน้ำ พักผ่อน' },
    { time: '15:30', desc: 'เดินทางกลับท่าเรือ' },
    { time: '17:00', desc: 'ส่งกลับโรงแรม' },
  ],
};

const reviews = [
  {
    id: 1,
    user: 'สมชาย',
    avatar: '🧑',
    rating: 5,
    date: '2 สัปดาห์ที่แล้ว',
    comment:
      'ทริปดีมากครับ ไกด์ดูแลดี อาหารอร่อย วิวสวยมากๆ แนะนำเลย!',
    photos: 2,
  },
  {
    id: 2,
    user: 'มาลี',
    avatar: '👩',
    rating: 4,
    date: '1 เดือนที่แล้ว',
    comment:
      'โดยรวมดีค่ะ ทะเลสวย เรือสะอาด แต่ค่อนข้างเร่งเวลานิดนึง',
    photos: 0,
  },
  {
    id: 3,
    user: 'John',
    avatar: '👨',
    rating: 5,
    date: '1 เดือนที่แล้ว',
    comment: 'Amazing experience! The James Bond island is breathtaking.',
    photos: 3,
  },
];

export default function TourDetailPage() {
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Image Gallery */}
      <div className="relative">
        <div className="relative h-72 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${tourData.images[currentImage]})`,
              }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        </div>

        {/* Nav buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link
            href="/tours"
            className="w-10 h-10 rounded-full glass flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-800'}`}
              />
            </button>
            <button className="w-10 h-10 rounded-full glass flex items-center justify-center">
              <Share2 className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {tourData.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                i === currentImage
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent opacity-70'
              }`}
            >
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${img})` }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-t-3xl pt-6">
          {/* Title + rating */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-sm text-ocean-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span>{tourData.location}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {tourData.name}
              </h1>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold">{tourData.rating}</span>
              <span className="text-xs text-gray-500">
                ({tourData.reviewCount} รีวิว)
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{tourData.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>สูงสุด {tourData.capacity} คน</span>
            </div>
          </div>

          {/* Provider */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-ocean-50 mb-5">
            <div className="w-10 h-10 rounded-full bg-ocean-700 flex items-center justify-center">
              <Ship className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {tourData.provider}
              </p>
              <p className="text-xs text-gray-500">ผู้ให้บริการที่ได้รับการยืนยัน</p>
            </div>
            <div className="flex items-center gap-1 text-ocean-700">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">ยืนยันแล้ว</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900 mb-2">
              รายละเอียด
            </h2>
            <p
              className={`text-sm text-gray-600 leading-relaxed ${!showFullDesc ? 'line-clamp-3' : ''}`}
            >
              {tourData.description}
            </p>
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-sm text-ocean-600 font-medium mt-1"
            >
              {showFullDesc ? 'แสดงน้อยลง' : 'อ่านเพิ่มเติม'}
            </button>
          </div>

          {/* Highlights */}
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              สิ่งที่รวมในแพ็กเกจ
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {tourData.highlights.map((h) => (
                <div key={h} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              กำหนดการ
            </h2>
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-ocean-200" />
              {tourData.schedule.map((s, i) => (
                <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="absolute left-[-18px] top-1 w-3 h-3 rounded-full bg-ocean-500 border-2 border-white shadow-sm" />
                  <div>
                    <span className="text-xs font-bold text-ocean-700">
                      {s.time}
                    </span>
                    <p className="text-sm text-gray-700">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Map placeholder */}
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              เส้นทาง
            </h2>
            <div className="h-44 rounded-2xl ocean-gradient relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <MapPin className="w-8 h-8 mx-auto mb-2 animate-float" />
                  <p className="text-sm font-medium">แผนที่เส้นทาง</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">
                รีวิว ({tourData.reviewCount})
              </h2>
              <Link
                href={`/reviews/${tourData.id}`}
                className="text-sm text-ocean-600 font-medium flex items-center gap-0.5"
              >
                ดูทั้งหมด <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Rating summary */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {tourData.rating}
                </p>
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.round(tourData.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tourData.reviewCount} รีวิว
                </p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-3">{star}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{
                          width: `${star === 5 ? 65 : star === 4 ? 25 : star === 3 ? 7 : star === 2 ? 2 : 1}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review list */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{review.avatar}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{review.user}</p>
                      <p className="text-xs text-gray-400">{review.date}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  {review.photos > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Camera className="w-3 h-3" />
                      <span>{review.photos} รูปภาพ</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-100 safe-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-3">
          <div>
            {tourData.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ฿{tourData.originalPrice.toLocaleString()}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-ocean-800">
                ฿{tourData.price.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">/คน</span>
            </div>
          </div>
          <Link
            href="/booking"
            className="px-8 py-3 rounded-2xl bg-ocean-700 text-white font-bold text-sm shadow-lg shadow-ocean-700/30 active:scale-95 transition-transform"
          >
            จองเลย
          </Link>
        </div>
      </div>
    </div>
  );
}
