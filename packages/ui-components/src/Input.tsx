'use client';

import React, { forwardRef, useId } from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type InputVariant = 'default' | 'filled';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: InputVariant;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<InputVariant, string> = {
  default: 'bg-white border-gray-200 focus-within:border-[#0077b6]',
  filled: 'bg-[#f0f9ff] border-transparent focus-within:border-[#0077b6] focus-within:bg-white',
};

const sizeStyles: Record<string, string> = {
  sm: 'h-9 text-sm',
  md: 'h-11 text-sm',
  lg: 'h-13 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      variant = 'default',
      iconLeft,
      iconRight,
      inputSize = 'md',
      className,
      id: propId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3',
            'transition-all duration-200',
            'focus-within:ring-2 focus-within:ring-[#0077b6]/20',
            error
              ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500/20'
              : variantStyles[variant],
            sizeStyles[inputSize],
            className,
          )}
        >
          {iconLeft && (
            <span className="flex-shrink-0 text-gray-400">{iconLeft}</span>
          )}
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            className={cn(
              'flex-1 bg-transparent outline-none placeholder:text-gray-400',
              'text-gray-900 disabled:cursor-not-allowed disabled:opacity-50',
            )}
            {...props}
          />
          {iconRight && (
            <span className="flex-shrink-0 text-gray-400">{iconRight}</span>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-xs text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
