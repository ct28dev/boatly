'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Anchor } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface HeaderProps {
  transparent?: boolean;
  notificationCount?: number;
  userName?: string;
  userAvatar?: string;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
}

export function Header({
  transparent = false,
  notificationCount = 0,
  userName,
  userAvatar,
  onSearchClick,
  onNotificationClick,
  onAvatarClick,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparent) return;
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent]);

  const showSolid = !transparent || scrolled;

  return (
    <motion.header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 safe-top',
        'transition-all duration-300',
        showSolid
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm'
          : 'bg-transparent',
      )}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-xl',
              showSolid ? 'bg-[#0077b6]' : 'bg-white/20 backdrop-blur-sm',
            )}
          >
            <Anchor
              className={cn('h-4.5 w-4.5', showSolid ? 'text-white' : 'text-white')}
            />
          </div>
          <span
            className={cn(
              'text-lg font-bold tracking-tight',
              showSolid ? 'text-[#0077b6]' : 'text-white',
            )}
          >
            BOATLY
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onSearchClick}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full',
              'transition-colors duration-200',
              showSolid
                ? 'text-gray-600 hover:bg-gray-100'
                : 'text-white hover:bg-white/20',
            )}
            aria-label="Search tours"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            onClick={onNotificationClick}
            className={cn(
              'relative flex items-center justify-center w-10 h-10 rounded-full',
              'transition-colors duration-200',
              showSolid
                ? 'text-gray-600 hover:bg-gray-100'
                : 'text-white hover:bg-white/20',
            )}
            aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
          >
            <Bell className="h-5 w-5" />
            <AnimatePresence>
              {notificationCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={cn(
                    'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                    'min-w-[18px] h-[18px] rounded-full px-1',
                    'bg-red-500 text-white text-[10px] font-bold',
                    'border-2',
                    showSolid ? 'border-white' : 'border-transparent',
                  )}
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={onAvatarClick}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full',
              'overflow-hidden ring-2 ml-1',
              'transition-all duration-200',
              showSolid
                ? 'ring-[#0077b6]/20 hover:ring-[#0077b6]/40'
                : 'ring-white/30 hover:ring-white/60',
            )}
            aria-label="User menu"
          >
            {userAvatar ? (
              <img src={userAvatar} alt={userName || 'User'} className="h-full w-full object-cover" />
            ) : (
              <div className={cn(
                'h-full w-full flex items-center justify-center text-xs font-bold',
                showSolid ? 'bg-[#0077b6] text-white' : 'bg-white/30 text-white',
              )}>
                {userName ? userName[0].toUpperCase() : '?'}
              </div>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
