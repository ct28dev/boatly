'use client';

import React from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  imageHeight?: string;
  onClick?: () => void;
}

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  className,
  padding = 'md',
  hoverable = false,
  imageUrl,
  imageAlt = '',
  imageHeight = 'h-48',
  onClick,
}: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'rounded-2xl bg-white border border-gray-100',
        'shadow-card overflow-hidden',
        'transition-all duration-300 ease-out',
        hoverable && 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer',
        onClick && 'text-left w-full',
        className,
      )}
    >
      {imageUrl && (
        <div className={cn('w-full overflow-hidden', imageHeight)}>
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </Component>
  );
}
