import { cn } from '@bluedot/ui';
import React from 'react';

export const DocumentIcon: React.FC<{ size?: number; className?: string }> = ({ size = 12, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size * 1.25}
    viewBox="0 0 12 15"
    fill="none"
    className={cn('translate-y-[0.5px]', className)}
  >
    <path d="M1.66651 14.0001H10.3332C10.8855 14.0001 11.3332 13.5524 11.3332 13.0001V7.33342V4.94289C11.3332 4.76608 11.2629 4.59651 11.1379 4.47149L7.52843 0.86201C7.40341 0.736986 7.23384 0.666748 7.05703 0.666748H5.99984H1.6665C1.11422 0.666748 0.666504 1.11446 0.666504 1.66675V13.0001C0.666504 13.5524 1.11422 14.0001 1.66651 14.0001Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.3335 0.666748V4.00008C7.3335 4.36827 7.63197 4.66675 8.00016 4.66675H11.3335" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.3335 8.00024L8.66683 8.00024" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.3335 10.6667H6.66683" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
