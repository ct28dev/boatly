'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Ship, Map, Heart, User } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FooterTab {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const defaultTabs: FooterTab[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/home' },
  { id: 'tours', label: 'Tours', icon: Ship, href: '/tours' },
  { id: 'map', label: 'Map', icon: Map, href: '/map' },
  { id: 'favorites', label: 'Favorites', icon: Heart, href: '/profile/favorites' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
];

export interface FooterProps {
  activeTab?: string;
  onTabChange?: (tab: FooterTab) => void;
  tabs?: FooterTab[];
}

export function Footer({
  activeTab = 'home',
  onTabChange,
  tabs = defaultTabs,
}: FooterProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-white/95 backdrop-blur-xl',
        'border-t border-gray-100 shadow-bottom-bar',
        'safe-bottom',
      )}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab)}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'w-16 h-full gap-0.5',
                'transition-colors duration-200',
                isActive ? 'text-[#0077b6]' : 'text-gray-400',
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5 transition-all duration-300',
                    isActive && 'scale-110',
                  )}
                  fill={isActive ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0077b6]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] leading-none',
                  isActive ? 'font-semibold' : 'font-medium',
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
