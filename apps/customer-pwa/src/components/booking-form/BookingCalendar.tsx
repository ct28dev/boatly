'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export interface BookingCalendarProps {
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
  availableDates?: string[];
  unavailableDates?: string[];
  minDate?: Date;
  maxDate?: Date;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function BookingCalendar({
  selectedDate,
  onDateSelect,
  availableDates = [],
  unavailableDates = [],
  minDate,
  maxDate,
}: BookingCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [direction, setDirection] = useState(0);

  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);
  const unavailableSet = useMemo(() => new Set(unavailableDates), [unavailableDates]);

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const navigate = useCallback((dir: number) => {
    setDirection(dir);
    if (dir === -1) {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    }
  }, [viewMonth]);

  const buddhisYear = viewYear + 543;

  const getDayStatus = useCallback((day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    const key = formatDateKey(date);
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isBeforeMin = minDate && date < minDate;
    const isAfterMax = maxDate && date > maxDate;

    if (isPast || isBeforeMin || isAfterMax) return 'disabled';
    if (unavailableSet.has(key)) return 'unavailable';
    if (availableSet.size > 0 && availableSet.has(key)) return 'available';
    if (availableSet.size === 0 && !isPast) return 'available';
    return 'default';
  }, [viewYear, viewMonth, today, minDate, maxDate, availableSet, unavailableSet]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h3
            key={`${viewYear}-${viewMonth}`}
            initial={{ opacity: 0, x: direction * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -20 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-bold text-gray-800"
          >
            {THAI_MONTHS[viewMonth]} {buddhisYear}
          </motion.h3>
        </AnimatePresence>
        <button
          onClick={() => navigate(1)}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {THAI_WEEKDAYS.map((day) => (
          <div
            key={day}
            className="flex items-center justify-center h-8 text-[11px] font-semibold text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${viewYear}-${viewMonth}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1"
        >
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(viewYear, viewMonth, day);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            const status = getDayStatus(day);

            return (
              <button
                key={day}
                disabled={status === 'disabled' || status === 'unavailable'}
                onClick={() => onDateSelect?.(date)}
                className={cn(
                  'relative flex items-center justify-center h-10 rounded-xl',
                  'text-sm font-medium transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6]',
                  isSelected
                    ? 'bg-[#0077b6] text-white shadow-md'
                    : status === 'available'
                      ? 'text-gray-800 hover:bg-[#e0f2fe]'
                      : status === 'unavailable'
                        ? 'text-gray-300 cursor-not-allowed'
                        : status === 'disabled'
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-800 hover:bg-gray-100',
                )}
                aria-label={`${day} ${THAI_MONTHS[viewMonth]} ${buddhisYear}${isToday ? ' (วันนี้)' : ''}${status === 'unavailable' ? ' (ไม่ว่าง)' : ''}`}
              >
                {day}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0077b6]" />
                )}
                {status === 'available' && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-gray-500">ว่าง</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0077b6]" />
          <span className="text-[11px] text-gray-500">เลือก</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          <span className="text-[11px] text-gray-500">ไม่ว่าง</span>
        </div>
      </div>
    </div>
  );
}
