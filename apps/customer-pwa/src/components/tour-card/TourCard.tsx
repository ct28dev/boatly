'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Clock, Star } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TourCardProps {
  id: string;
  name: string;
  imageUrl: string;
  location: string;
  duration: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  providerName: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function TourCard({
  id,
  name,
  imageUrl,
  location,
  duration,
  rating,
  reviewCount,
  price,
  originalPrice,
  providerName,
  isFavorite = false,
  onFavoriteToggle,
  onClick,
}: TourCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorite(!favorite);
    onFavoriteToggle?.(id);
  };

  const formattedPrice = new Intl.NumberFormat('th-TH').format(price);
  const formattedOriginalPrice = originalPrice
    ? new Intl.NumberFormat('th-TH').format(originalPrice)
    : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative rounded-2xl bg-white overflow-hidden',
        'shadow-card hover:shadow-card-hover',
        'transition-shadow duration-300',
        'cursor-pointer',
      )}
      onClick={() => onClick?.(id)}
      role="article"
      aria-label={`${name} - ${formattedPrice} THB`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {!imgLoaded && (
          <div className="absolute inset-0 shimmer" />
        )}
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={cn(
            'h-full w-full object-cover',
            'transition-all duration-500',
            'group-hover:scale-105',
            imgLoaded ? 'opacity-100' : 'opacity-0',
          )}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        <button
          onClick={handleFavorite}
          className={cn(
            'absolute top-3 right-3 flex items-center justify-center',
            'w-9 h-9 rounded-full',
            'bg-white/80 backdrop-blur-sm',
            'transition-all duration-200',
            'hover:bg-white hover:scale-110',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
          )}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={favorite ? 'filled' : 'empty'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Heart
                className={cn(
                  'h-4.5 w-4.5 transition-colors',
                  favorite ? 'text-red-500 fill-red-500' : 'text-gray-600',
                )}
              />
            </motion.div>
          </AnimatePresence>
        </button>

        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700">
            <Clock className="h-3 w-3" />
            {duration}
          </span>
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 flex-1">
            {name}
          </h3>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-gray-700">{rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-2.5">
          <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 line-clamp-1">{location}</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            {formattedOriginalPrice && (
              <span className="text-xs text-gray-400 line-through mr-1.5">
                ฿{formattedOriginalPrice}
              </span>
            )}
            <span className="text-base font-bold text-[#0077b6]">
              ฿{formattedPrice}
            </span>
            <span className="text-xs text-gray-400 ml-0.5">/คน</span>
          </div>
          <span className="text-[11px] text-gray-400 truncate max-w-[100px]">
            {providerName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
