import * as React from 'react';
import { cn } from '../lib/utils';

interface ProStoreBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProStoreBadge({ className, size = 'md' }: ProStoreBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  const iconSize = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full bg-[#1DC690] text-white font-[var(--font-sans)]',
        sizeClasses[size],
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSize[size]}
        height={iconSize[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      Verified Pro Store
    </span>
  );
}
