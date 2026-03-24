'use client';

import React, { useState } from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  onClick?: () => void;
}

const sizeMap: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-[10px]' },
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-14 w-14', text: 'text-lg' },
  xl: { container: 'h-20 w-20', text: 'text-2xl' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const bgColors = [
  'bg-[#0077b6]',
  'bg-[#00b4d8]',
  'bg-[#023e8a]',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
];

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function Avatar({ src, alt, name, size = 'md', className, onClick }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;
  const styles = sizeMap[size];
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full',
        'overflow-hidden flex-shrink-0',
        'ring-2 ring-white',
        styles.container,
        !showImage && (name ? nameToColor(name) : 'bg-gray-300'),
        onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6]',
        className,
      )}
      aria-label={alt || name || 'User avatar'}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={cn('font-semibold text-white select-none', styles.text)}>
          {name ? getInitials(name) : '?'}
        </span>
      )}
    </Component>
  );
}
