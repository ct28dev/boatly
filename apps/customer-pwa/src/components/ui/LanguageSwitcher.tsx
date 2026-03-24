'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export type Language = 'th' | 'en';

export interface LanguageSwitcherProps {
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  className?: string;
}

export function LanguageSwitcher({
  language,
  onLanguageChange,
  className,
}: LanguageSwitcherProps) {
  const toggle = () => {
    onLanguageChange?.(language === 'th' ? 'en' : 'th');
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        'relative flex items-center h-9 rounded-full',
        'bg-gray-100 p-0.5',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6]',
        className,
      )}
      aria-label={`Switch language to ${language === 'th' ? 'English' : 'Thai'}`}
    >
      <div className="relative flex items-center">
        <motion.div
          layout
          className="absolute h-8 w-[52px] rounded-full bg-white shadow-sm"
          style={{ left: language === 'th' ? 0 : 52 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />

        <div
          className={cn(
            'relative z-10 flex items-center gap-1.5 px-3 h-8',
            'text-xs font-semibold transition-colors duration-200',
            language === 'th' ? 'text-[#0077b6]' : 'text-gray-400',
          )}
        >
          <span className="text-base leading-none">🇹🇭</span>
          <span>TH</span>
        </div>

        <div
          className={cn(
            'relative z-10 flex items-center gap-1.5 px-3 h-8',
            'text-xs font-semibold transition-colors duration-200',
            language === 'en' ? 'text-[#0077b6]' : 'text-gray-400',
          )}
        >
          <span className="text-base leading-none">🇬🇧</span>
          <span>EN</span>
        </div>
      </div>
    </button>
  );
}
