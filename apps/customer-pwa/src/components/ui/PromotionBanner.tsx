'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Copy, Check, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PromotionBannerProps {
  title: string;
  discountText: string;
  code: string;
  expiresAt: Date;
  onClose?: () => void;
  className?: string;
}

function padZero(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

export function PromotionBanner({
  title,
  discountText,
  code,
  expiresAt,
  onClose,
  className,
}: PromotionBannerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, expiresAt.getTime() - Date.now());
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silently fail
    }
  };

  const isExpired = timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-4',
        'ocean-gradient text-white',
        className,
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close promotion"
        >
          <X className="h-4 w-4 text-white/80" />
        </button>
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider opacity-90">
            {title}
          </span>
        </div>

        <p className="text-2xl font-bold mb-3">{discountText}</p>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
            <span className="text-sm font-mono font-bold tracking-wider">{code}</span>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/20 transition-colors"
              aria-label={copied ? 'Copied!' : 'Copy code'}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs opacity-80">หมดเขตใน</span>
          <div className="flex items-center gap-1">
            {[
              { value: timeLeft.hours, label: 'ชม.' },
              { value: timeLeft.minutes, label: 'น.' },
              { value: timeLeft.seconds, label: 'วิ.' },
            ].map((unit, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-xs font-bold opacity-60">:</span>}
                <span className="inline-flex items-center justify-center w-8 h-7 rounded-md bg-white/20 text-xs font-bold font-mono">
                  {padZero(unit.value)}
                </span>
                <span className="text-[10px] opacity-70">{unit.label}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
