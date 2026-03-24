'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface StatsCardProps {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  sparklineData?: number[];
  className?: string;
}

export function StatsCard({
  label,
  value,
  change,
  icon: Icon,
  sparklineData,
  className,
}: StatsCardProps) {
  const isPositive = change >= 0;

  const chartData = (sparklineData || [12, 15, 13, 18, 16, 21, 19, 24]).map(
    (v) => ({ value: v })
  );

  return (
    <div className={cn('card p-6 relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-admin-muted font-medium">{label}</p>
          <p className="text-2xl font-bold text-admin-text mt-1">{value}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isPositive ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {isPositive ? '+' : ''}
              {change}%
            </span>
            <span className="text-xs text-admin-muted">vs last month</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-ocean-50 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-ocean-500" />
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-4 h-12 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`sparkGrad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fill={`url(#sparkGrad-${label})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
