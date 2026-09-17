import { cn } from '../utils';
import type { IconProps } from './types';

export const CloseIcon = ({ size = 24, className, ...props }: IconProps) => (
  <svg
    className={cn('fill-none stroke-2', className)}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeLinecap="round" />
  </svg>
);
