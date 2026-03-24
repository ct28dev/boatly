'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Tag } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PassengerBreakdown {
  label: string;
  count: number;
  pricePerPerson: number;
}

export interface BookingSummaryProps {
  tourImageUrl?: string;
  tourName: string;
  date: string;
  time: string;
  passengers: PassengerBreakdown[];
  pierName?: string;
  subtotal: number;
  discount?: number;
  discountLabel?: string;
  total: number;
  className?: string;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('th-TH').format(amount);
}

export function BookingSummary({
  tourImageUrl,
  tourName,
  date,
  time,
  passengers,
  pierName,
  subtotal,
  discount = 0,
  discountLabel,
  total,
  className,
}: BookingSummaryProps) {
  const totalPassengers = passengers.reduce((sum, p) => sum + p.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl bg-white border border-gray-100 shadow-card overflow-hidden',
        className,
      )}
    >
      {tourImageUrl && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={tourImageUrl}
            alt={tourName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <h3 className="absolute bottom-3 left-4 right-4 text-white font-bold text-sm line-clamp-2">
            {tourName}
          </h3>
        </div>
      )}

      <div className="p-4 space-y-4">
        {!tourImageUrl && (
          <h3 className="font-bold text-gray-900">{tourName}</h3>
        )}

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-sm">
            <Calendar className="h-4 w-4 text-[#0077b6] flex-shrink-0" />
            <span className="text-gray-700">{date}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Clock className="h-4 w-4 text-[#0077b6] flex-shrink-0" />
            <span className="text-gray-700">{time}</span>
          </div>
          {pierName && (
            <div className="flex items-center gap-2.5 text-sm">
              <MapPin className="h-4 w-4 text-[#0077b6] flex-shrink-0" />
              <span className="text-gray-700">{pierName}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm">
            <Users className="h-4 w-4 text-[#0077b6] flex-shrink-0" />
            <span className="text-gray-700">{totalPassengers} คน</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
          {passengers
            .filter((p) => p.count > 0)
            .map((p) => (
              <div key={p.label} className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {p.label} x {p.count}
                </span>
                <span className="text-gray-700 font-medium">
                  ฿{formatPrice(p.pricePerPerson * p.count)}
                </span>
              </div>
            ))}

          <div className="flex justify-between text-sm pt-1">
            <span className="text-gray-500">ราคารวม</span>
            <span className="text-gray-700">฿{formatPrice(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-emerald-600">
                <Tag className="h-3.5 w-3.5" />
                {discountLabel || 'ส่วนลด'}
              </span>
              <span className="text-emerald-600 font-medium">
                -฿{formatPrice(discount)}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-800">ยอดชำระ</span>
          <span className="text-xl font-bold text-[#0077b6]">
            ฿{formatPrice(total)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
