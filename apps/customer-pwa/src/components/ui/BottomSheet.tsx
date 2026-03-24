'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnap?: number;
  className?: string;
}

const DRAG_THRESHOLD = 100;

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9],
  defaultSnap = 0,
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 300], [1, 0]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose],
  );

  const sheetHeight = typeof window !== 'undefined'
    ? `${snapPoints[defaultSnap] * 100}vh`
    : '50vh';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y, height: sheetHeight }}
            className={cn(
              'absolute bottom-0 left-0 right-0',
              'bg-white rounded-t-3xl shadow-xl',
              'flex flex-col overflow-hidden',
              'touch-none',
              className,
            )}
          >
            <div className="flex-shrink-0 pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {title && (
              <div className="flex-shrink-0 px-5 pb-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
              </div>
            )}

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
