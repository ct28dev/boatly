'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Camera,
  X,
  Send,
  ImagePlus,
  Ship,
} from 'lucide-react';

export default function ReviewFormPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const addMockPhoto = () => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=200&h=200&fit=crop',
    ];
    if (photos.length < 6) {
      setPhotos([...photos, mockPhotos[photos.length % mockPhotos.length]]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const ratingLabels = ['', 'แย่มาก', 'แย่', 'ปานกลาง', 'ดี', 'ดีมาก!'];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-card p-8 text-center max-w-sm w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-4xl">🎉</span>
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            ขอบคุณสำหรับรีวิว!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            รีวิวของคุณจะช่วยให้ผู้อื่นตัดสินใจได้ง่ายขึ้น
          </p>
          <Link
            href="/home"
            className="block w-full py-3 rounded-2xl bg-ocean-700 text-white font-bold text-sm"
          >
            กลับหน้าแรก
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">เขียนรีวิว</h1>
        </div>
      </div>

      <div className="px-5 py-5">
        {/* Tour card */}
        <div className="bg-white rounded-2xl shadow-card p-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-ocean-50 flex items-center justify-center">
              <Ship className="w-7 h-7 text-ocean-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                เกาะเจมส์บอนด์ + เกาะปันหยี
              </h3>
              <p className="text-xs text-gray-500">15 มี.ค. 2569</p>
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-5 text-center">
          <h3 className="font-bold text-gray-900 mb-4">
            ให้คะแนนทริปนี้
          </h3>
          <div className="flex justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileTap={{ scale: 1.3 }}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1"
              >
                <Star
                  className={`w-10 h-10 transition-all duration-200 ${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400 scale-110'
                      : 'text-gray-300'
                  }`}
                />
              </motion.button>
            ))}
          </div>
          {(hoverRating || rating) > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-ocean-700"
            >
              {ratingLabels[hoverRating || rating]}
            </motion.p>
          )}
        </div>

        {/* Photo upload */}
        <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
          <h3 className="font-bold text-gray-900 mb-3">
            เพิ่มรูปภาพ
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${photo})` }}
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <button
                onClick={addMockPhoto}
                className="aspect-square rounded-xl border-2 border-dashed border-ocean-200 flex flex-col items-center justify-center gap-1 text-ocean-400 hover:border-ocean-400 hover:text-ocean-600 transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-[10px] font-medium">เพิ่มรูป</span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            สูงสุด 6 รูป ({photos.length}/6)
          </p>
        </div>

        {/* Comment */}
        <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
          <h3 className="font-bold text-gray-900 mb-3">
            เขียนความคิดเห็น
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="เล่าประสบการณ์ของคุณ เช่น บรรยากาศ, บริการ, อาหาร, ความคุ้มค่า..."
            rows={5}
            className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {comment.length} ตัวอักษร
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-ocean-700 text-white font-bold text-sm shadow-lg shadow-ocean-700/30 disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <Send className="w-4 h-4" />
              ส่งรีวิว
            </>
          )}
        </button>
      </div>
    </div>
  );
}
