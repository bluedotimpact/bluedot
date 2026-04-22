import { cn } from '@bluedot/ui';
import type { IconProps } from './types';

export const ChevronRightIcon = ({ size = 20, className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    className={cn('text-[#1F2937]', className)}
    {...props}
  >
    <path
      d="M7.5 5L12.5 10L7.5 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
