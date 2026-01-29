import React from 'react';
import { cn } from '../utils';

export const PersonIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg className={cn(className)} width={size} height={size} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z" />
  </svg>
);
