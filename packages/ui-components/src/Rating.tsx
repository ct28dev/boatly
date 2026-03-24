'use client';

import React, { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
  allowHalf?: boolean;
  showValue?: boolean;
  className?: string;
}

const sizeMap: Record<string, { icon: string; gap: string; text: string }> = {
  sm: { icon: 'h-3.5 w-3.5', gap: 'gap-0.5', text: 'text-xs' },
  md: { icon: 'h-5 w-5', gap: 'gap-0.5', text: 'text-sm' },
  lg: { icon: 'h-6 w-6', gap: 'gap-1', text: 'text-base' },
};

export function Rating({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  allowHalf = true,
  showValue = false,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const styles = sizeMap[size];
  const displayValue = hoverValue ?? value;

  const handleClick = useCallback(
    (starIndex: number, isHalf: boolean) => {
      if (!interactive || !onChange) return;
      const newVal = allowHalf && isHalf ? starIndex + 0.5 : starIndex + 1;
      onChange(newVal);
    },
    [interactive, onChange, allowHalf],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const isHalf = allowHalf && e.clientX - rect.left < rect.width / 2;
      setHoverValue(isHalf ? starIndex + 0.5 : starIndex + 1);
    },
    [interactive, allowHalf],
  );

  return (
    <div
      className={cn('inline-flex items-center', styles.gap, className)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`Rating: ${value} out of ${max}`}
      onMouseLeave={() => interactive && setHoverValue(null)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const fillPercent =
          displayValue >= i + 1 ? 100 : displayValue > i ? (displayValue - i) * 100 : 0;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isHalf = allowHalf && e.clientX - rect.left < rect.width / 2;
              handleClick(i, isHalf);
            }}
            onMouseMove={(e) => handleMouseMove(e, i)}
            className={cn(
              'relative inline-flex',
              interactive
                ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0077b6] rounded-sm'
                : 'cursor-default',
            )}
            aria-label={interactive ? `${i + 1} star${i !== 0 ? 's' : ''}` : undefined}
          >
            <Star className={cn(styles.icon, 'text-gray-200 fill-gray-200')} />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <Star className={cn(styles.icon, 'text-amber-400 fill-amber-400')} />
            </div>
          </button>
        );
      })}
      {showValue && (
        <span className={cn('ml-1 font-semibold text-gray-700', styles.text)}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
