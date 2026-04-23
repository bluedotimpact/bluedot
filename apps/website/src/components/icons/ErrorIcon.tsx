import { cn } from '@bluedot/ui';
import type { IconProps } from './types';

export const ErrorIcon = ({ size = 16, className, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="none"
    width={size}
    height={size}
    className={cn('text-[#DC0000]', className)}
    {...props}
  >
    <circle cx="8" cy="8" r="7.375" stroke="currentColor" strokeWidth="1.25" />
    <path d="M5 5L11 11M11 5L5 11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);
