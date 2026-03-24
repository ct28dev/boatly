import React from 'react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className,
      )}
    >
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f0f9ff] mb-4">
          <div className="text-[#0077b6]">{icon}</div>
        </div>
      )}

      <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'mt-5 inline-flex items-center justify-center',
            'h-10 px-6 rounded-xl',
            'bg-[#0077b6] text-white text-sm font-semibold',
            'hover:bg-[#023e8a] active:bg-[#03045e]',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6] focus-visible:ring-offset-2',
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
