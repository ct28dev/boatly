'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Users } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PassengerType {
  id: string;
  label: string;
  sublabel: string;
  count: number;
  min: number;
  max: number;
  pricePerPerson: number;
}

const defaultPassengerTypes: PassengerType[] = [
  { id: 'adult', label: 'ผู้ใหญ่', sublabel: 'อายุ 13 ปีขึ้นไป', count: 1, min: 1, max: 20, pricePerPerson: 0 },
  { id: 'child', label: 'เด็ก', sublabel: '3-12 ปี', count: 0, min: 0, max: 10, pricePerPerson: 0 },
  { id: 'infant', label: 'ทารก', sublabel: 'ต่ำกว่า 3 ปี', count: 0, min: 0, max: 5, pricePerPerson: 0 },
];

export interface PassengerSelectorProps {
  passengers?: PassengerType[];
  onChange?: (passengers: PassengerType[]) => void;
  maxTotal?: number;
}

export function PassengerSelector({
  passengers = defaultPassengerTypes,
  onChange,
  maxTotal = 30,
}: PassengerSelectorProps) {
  const totalCount = passengers.reduce((sum, p) => sum + p.count, 0);

  const handleChange = (id: string, delta: number) => {
    const updated = passengers.map((p) => {
      if (p.id !== id) return p;
      const next = p.count + delta;
      if (next < p.min || next > p.max) return p;
      if (delta > 0 && totalCount >= maxTotal) return p;
      return { ...p, count: next };
    });
    onChange?.(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">จำนวนผู้โดยสาร</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users className="h-3.5 w-3.5" />
          <span>รวม {totalCount} คน</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-card divide-y divide-gray-100">
        {passengers.map((passenger) => {
          const canDecrease = passenger.count > passenger.min;
          const canIncrease = passenger.count < passenger.max && totalCount < maxTotal;

          return (
            <div
              key={passenger.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {passenger.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {passenger.sublabel}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleChange(passenger.id, -1)}
                  disabled={!canDecrease}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    'border-2 transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6]',
                    canDecrease
                      ? 'border-[#0077b6] text-[#0077b6] hover:bg-[#f0f9ff] active:bg-[#e0f2fe]'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed',
                  )}
                  aria-label={`Decrease ${passenger.label}`}
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>

                <motion.span
                  key={passenger.count}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-6 text-center text-base font-bold text-gray-800"
                >
                  {passenger.count}
                </motion.span>

                <button
                  onClick={() => handleChange(passenger.id, 1)}
                  disabled={!canIncrease}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    'border-2 transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6]',
                    canIncrease
                      ? 'border-[#0077b6] text-[#0077b6] hover:bg-[#f0f9ff] active:bg-[#e0f2fe]'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed',
                  )}
                  aria-label={`Increase ${passenger.label}`}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
