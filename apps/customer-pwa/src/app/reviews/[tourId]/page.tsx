'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Camera,
  ThumbsUp,
  Filter,
  ChevronDown,
  MapPin,
  Ship,
} from 'lucide-react';

const tourInfo = {
  id: '1',
  name: 'เกาะเจมส์บอนด์ + เกาะปันหยี',
  location: 'อ่าวพังงา',
  rating: 4.8,
  reviewCount: 324,
  image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400&h=200&fit=crop',
};

const ratingDistribution = [
  { stars: 5, count: 210, percent: 65 },
  { stars: 4, count: 81, percent: 25 },
  { stars: 3, count: 23, percent: 7 },
  { stars: 2, count: 7, percent: 2 },
  { stars: 1, count: 3, percent: 1 },
];

const reviews = [
  {
    id: 1,
    user: 'สมชาย จ.',
    avatar: '🧑',
    rating: 5,
    date: '10 มี.ค. 2569',
    comment:
      'ทริปดีมากครับ ไกด์ดูแลดี คอยอธิบายตลอด อาหารกลางวันบนเกาะปันหยีอร่อยสุดๆ วิวสวยมากๆ น้ำใสเหมือนกระจก แนะนำเลยครับ คุ้มค่ามากๆ!',
    photos: [
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&h=200&fit=crop',
    ],
    helpful: 24,
  },
  {
    id: 2,
    user: 'มาลี ส.',
    avatar: '👩',
    rating: 4,
    date: '5 มี.ค. 2569',
    comment:
      'โดยรวมดีค่ะ ทะเลสวย เรือสะอาด ลูกเรือน่ารัก แต่ค่อนข้างเร่งเวลาที่เกาะเจมส์บอนด์นิดนึง อยากอยู่นานกว่านี้ค่ะ',
    photos: [],
    helpful: 12,
  },
  {
    id: 3,
    user: 'John D.',
    avatar: '👨',
    rating: 5,
    date: '28 ก.พ. 2569',
    comment:
      'Amazing experience! The James Bond island is breathtaking. Our guide was very knowledgeable and funny. The snorkeling at Naka island was the highlight for me. Crystal clear water!',
    photos: [
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=200&h=200&fit=crop',
    ],
    helpful: 31,
  },
  {
    id: 4,
    user: 'พิม ว.',
    avatar: '👧',
    rating: 5,
    date: '20 ก.พ. 2569',
    comment:
      'พาลูกๆ ไปเที่ยว สนุกมากเลยค่ะ เด็กๆ ชอบมาก โดยเฉพาะช่วงดำน้ำ เจ้าหน้าที่ดูแลดีมาก มีชูชีพเด็กให้ด้วย ปลอดภัยมาก',
    photos: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&h=200&fit=crop',
    ],
    helpful: 18,
  },
  {
    id: 5,
    user: 'ธีร์ ก.',
    avatar: '🧔',
    rating: 3,
    date: '15 ก.พ. 2569',
    comment:
      'ทริปพอใช้ได้ครับ แต่คนเยอะมาก เรือแออัดนิดหน่อย ถ้าไปช่วงคนน้อยน่าจะดีกว่านี้ อาหารอร่อยดี',
    photos: [],
    helpful: 5,
  },
];

type FilterType = 'all' | '5' | '4' | '3' | '2' | '1' | 'photos';

export default function ReviewGalleryPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'all') return true;
    if (filter === 'photos') return review.photos.length > 0;
    return review.rating === parseInt(filter);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/tours/1" className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">รีวิวทั้งหมด</h1>
        </div>
      </div>

      {/* Tour info header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-5 py-4 flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${tourInfo.image})` }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
              {tourInfo.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <MapPin className="w-3 h-3" />
              {tourInfo.location}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        {/* Rating summary */}
        <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">
                {tourInfo.rating}
              </p>
              <div className="flex items-center gap-0.5 mt-1 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(tourInfo.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {tourInfo.reviewCount} รีวิว
              </p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingDistribution.map((r) => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-3">{r.stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.percent}%` }}
                      transition={{ duration: 0.8, delay: r.stars * 0.1 }}
                      className="h-full rounded-full bg-amber-400"
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-5 -mx-5 px-5">
          {[
            { id: 'all' as FilterType, label: 'ทั้งหมด' },
            { id: '5' as FilterType, label: '5 ดาว' },
            { id: '4' as FilterType, label: '4 ดาว' },
            { id: '3' as FilterType, label: '3 ดาว' },
            { id: '2' as FilterType, label: '2 ดาว' },
            { id: '1' as FilterType, label: '1 ดาว' },
            { id: 'photos' as FilterType, label: '📷 มีรูปภาพ' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.id
                  ? 'bg-ocean-700 text-white shadow-md'
                  : 'bg-white text-gray-600 shadow-card'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Review list */}
        <div className="space-y-4">
          {filteredReviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-card p-4"
            >
              {/* User info */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{review.avatar}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {review.user}
                  </p>
                  <p className="text-xs text-gray-400">{review.date}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Comment */}
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {review.comment}
              </p>

              {/* Photos */}
              {review.photos.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
                  {review.photos.map((photo, pi) => (
                    <div
                      key={pi}
                      className="w-24 h-24 rounded-xl bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url(${photo})` }}
                    />
                  ))}
                </div>
              )}

              {/* Helpful */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-ocean-600 transition-colors">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  เป็นประโยชน์ ({review.helpful})
                </button>
                {review.photos.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Camera className="w-3 h-3" />
                    {review.photos.length} รูป
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-16">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ไม่มีรีวิวในหมวดนี้</p>
          </div>
        )}
      </div>
    </div>
  );
}
