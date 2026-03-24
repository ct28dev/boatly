'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Anchor } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({
  message,
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#48cae4]',
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: ['-10%', '10%', '-10%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-0 right-0"
        >
          <svg viewBox="0 0 1440 200" className="w-[120%] -ml-[10%] opacity-20">
            <path
              fill="white"
              d="M0,128L48,133.3C96,139,192,149,288,144C384,139,480,117,576,112C672,107,768,117,864,128C960,139,1056,149,1152,144C1248,139,1344,117,1392,106.7L1440,96L1440,200L0,200Z"
            />
          </svg>
        </motion.div>

        <motion.div
          animate={{ x: ['10%', '-10%', '10%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-0 right-0"
        >
          <svg viewBox="0 0 1440 200" className="w-[120%] -ml-[10%] opacity-10">
            <path
              fill="white"
              d="M0,160L48,154.7C96,149,192,139,288,144C384,149,480,171,576,176C672,181,768,171,864,160C960,149,1056,139,1152,144C1248,149,1344,171,1392,181.3L1440,192L1440,200L0,200Z"
            />
          </svg>
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, -5, 0, 5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
            <Anchor className="h-10 w-10 text-white" />
          </div>
        </motion.div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-wider mb-1">
            BOATLY
          </h1>
          {message && (
            <p className="text-sm text-white/70">{message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-white"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
