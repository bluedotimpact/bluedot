import React from 'react';
import { cn } from '../utils';

export const InfoCircleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg className={cn('fill-none stroke-2 text-gray-500', className)} width={size} height={size} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.25 9.75V7.25M7.25 4.75H7.25625M13.5 7.25C13.5 10.7018 10.7018 13.5 7.25 13.5C3.79822 13.5 1 10.7018 1 7.25C1 3.79822 3.79822 1 7.25 1C10.7018 1 13.5 3.79822 13.5 7.25Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
