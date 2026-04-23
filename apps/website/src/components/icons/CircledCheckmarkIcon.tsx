import { cn } from '@bluedot/ui';
import type { IconProps } from './types';

export const CircledCheckmarkIcon = ({ size = 16, className, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="none"
    width={size}
    height={size}
    className={cn('text-bluedot-normal', className)}
    {...props}
  >
    <circle cx="8" cy="8" r="7.375" stroke="currentColor" strokeWidth="1.25" />
    <path
      d="M4.5 8L7 10.5L11.5 5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
