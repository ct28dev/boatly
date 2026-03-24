'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Ship, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TimeSlot {
  id: string;
  time: string;
  label: string;
  availableSpots: number;
  maxSpots: number;
}

const defaultSlots: TimeSlot[] = [
  { id: 'morning', time: '09:00', label: 'เช้า', availableSpots: 12, maxSpots: 20 },
  { id: 'afternoon', time: '13:00', label: 'บ่าย', availableSpots: 8, maxSpots: 20 },
  { id: 'evening', time: '16:00', label: 'เย็น', availableSpots: 15, maxSpots: 20 },
];

export interface TimeSlotSelectorProps {
  slots?: TimeSlot[];
  selectedSlotId?: string | null;
  onSelect?: (slot: TimeSlot) => void;
}

export function TimeSlotSelector({
  slots = defaultSlots,
  selectedSlotId,
  onSelect,
}: TimeSlotSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800">เลือกรอบเวลา</h3>
      <div className="grid grid-cols-3 gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          const isSoldOut = slot.availableSpots === 0;

          return (
            <motion.button
              key={slot.id}
              whileTap={!isSoldOut ? { scale: 0.97 } : undefined}
              disabled={isSoldOut}
              onClick={() => !isSoldOut && onSelect?.(slot)}
              className={cn(
                'relative flex flex-col items-center gap-2 p-4 rounded-2xl',
                'border-2 transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6] focus-visible:ring-offset-2',
                isSelected
                  ? 'border-[#0077b6] bg-[#f0f9ff] shadow-md'
                  : isSoldOut
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-[#48cae4] hover:bg-[#f0f9ff]',
              )}
              aria-label={`${slot.time} ${slot.label} - ${isSoldOut ? 'เต็ม' : `เหลือ ${slot.availableSpots} ที่`}`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-[#0077b6]"
                >
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </motion.div>
              )}

              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full',
                  isSelected ? 'bg-[#0077b6]' : 'bg-[#e0f2fe]',
                )}
              >
                <Ship
                  className={cn(
                    'h-5 w-5',
                    isSelected ? 'text-white' : 'text-[#0077b6]',
                  )}
                />
              </div>

              <div className="text-center">
                <p
                  className={cn(
                    'text-lg font-bold',
                    isSelected ? 'text-[#0077b6]' : 'text-gray-800',
                  )}
                >
                  {slot.time}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{slot.label}</p>
              </div>

              <div
                className={cn(
                  'text-[11px] font-medium px-2 py-0.5 rounded-full',
                  isSoldOut
                    ? 'bg-red-50 text-red-500'
                    : slot.availableSpots <= 5
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600',
                )}
              >
                {isSoldOut ? 'เต็ม' : `เหลือ ${slot.availableSpots} ที่`}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
