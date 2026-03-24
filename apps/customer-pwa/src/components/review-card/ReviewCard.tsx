'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ReviewCardProps {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  images?: string[];
  helpfulCount?: number;
  isHelpful?: boolean;
  onHelpfulClick?: (id: string) => void;
  onImageClick?: (imageUrl: string) => void;
}

export function ReviewCard({
  id,
  userName,
  userAvatar,
  rating,
  date,
  comment,
  images = [],
  helpfulCount = 0,
  isHelpful = false,
  onHelpfulClick,
  onImageClick,
}: ReviewCardProps) {
  const [helpful, setHelpful] = useState(isHelpful);
  const [count, setCount] = useState(helpfulCount);

  const handleHelpful = () => {
    const next = !helpful;
    setHelpful(next);
    setCount((c) => (next ? c + 1 : c - 1));
    onHelpfulClick?.(id);
  };

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#0077b6] flex items-center justify-center ring-2 ring-gray-100">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-800 truncate">
              {userName}
            </h4>
            <span className="text-xs text-gray-400 flex-shrink-0">{date}</span>
          </div>

          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3.5 w-3.5',
                  i < Math.floor(rating)
                    ? 'text-amber-400 fill-amber-400'
                    : i < rating
                      ? 'text-amber-400 fill-amber-400 opacity-50'
                      : 'text-gray-200 fill-gray-200',
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{comment}</p>

      {images.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onImageClick?.(img)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6]',
              )}
            >
              <img
                src={img}
                alt={`Review photo ${i + 1}`}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleHelpful}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6]',
            helpful
              ? 'bg-[#e0f2fe] text-[#0077b6]'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
          )}
          aria-label={`Mark as helpful (${count})`}
          aria-pressed={helpful}
        >
          <ThumbsUp className={cn('h-3.5 w-3.5', helpful && 'fill-current')} />
          เป็นประโยชน์ {count > 0 && `(${count})`}
        </motion.button>
      </div>
    </div>
  );
}
