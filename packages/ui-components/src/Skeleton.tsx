import React from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SkeletonVariant = 'text' | 'circle' | 'card' | 'image';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  lines?: number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) {
  const baseClass = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer';

  if (variant === 'circle') {
    return (
      <div
        className={cn(baseClass, 'rounded-full', className)}
        style={{ width: width || '40px', height: height || '40px' }}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'image') {
    return (
      <div
        className={cn(baseClass, 'rounded-2xl', className)}
        style={{ width: width || '100%', height: height || '200px' }}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn('rounded-2xl overflow-hidden', className)}
        style={{ width: width || '100%' }}
        aria-hidden="true"
      >
        <div className={cn(baseClass, 'h-48 w-full')} />
        <div className="space-y-3 p-4">
          <div className={cn(baseClass, 'h-4 w-3/4 rounded-md')} />
          <div className={cn(baseClass, 'h-3 w-1/2 rounded-md')} />
          <div className="flex justify-between pt-2">
            <div className={cn(baseClass, 'h-5 w-20 rounded-md')} />
            <div className={cn(baseClass, 'h-5 w-16 rounded-md')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            baseClass,
            'h-3 rounded-md',
            i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full',
          )}
          style={{ width: i === lines - 1 && lines > 1 ? undefined : width, height }}
        />
      ))}
    </div>
  );
}
