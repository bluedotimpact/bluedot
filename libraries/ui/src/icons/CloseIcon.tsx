import type React from 'react';
import { cn } from '../utils';

export const CloseIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg className={cn('fill-none stroke-2', className)} width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeLinecap="round" />
  </svg>
);
