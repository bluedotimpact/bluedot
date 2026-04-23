import { cn } from '@bluedot/ui';
import type { IconProps } from './types';

export const PlayCircleIcon = ({ size = 16, className, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="none"
    width={size}
    height={size}
    className={cn('text-[#6A6F7A]', className)}
    {...props}
  >
    <rect x="0.625" y="0.625" width="14.75" height="14.75" rx="7.375" stroke="currentColor" strokeWidth="1.25" />
    <path
      d="M6 10.4839V5.51675C6 5.13551 6.40956 4.89452 6.74282 5.07967L11.2133 7.56325C11.5562 7.75375 11.5562 8.2469 11.2133 8.4374L6.74282 10.921C6.40956 11.1061 6 10.8651 6 10.4839Z"
      fill="currentColor"
    />
  </svg>
);
