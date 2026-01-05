import { cn } from '@bluedot/ui';
import React from 'react';

type CheckmarkIconProps = {
  className?: string;
  variant?: 'completed' | 'hover';
};

export const CheckmarkIcon: React.FC<CheckmarkIconProps> = ({ className, variant = 'completed' }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    className={cn(
      'fill-none',
      variant === 'completed'
        ? 'stroke-white stroke-[1.75]'
        : 'stroke-[rgba(42,45,52,0.6)] stroke-[1.5]',
      className,
    )}
    aria-hidden="true"
  >
    <path d="M2.5 6L5 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
