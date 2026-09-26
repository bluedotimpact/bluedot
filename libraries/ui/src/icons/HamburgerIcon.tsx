import { cn } from '../utils';
import type { IconProps } from './types';

export const HamburgerIcon = ({ size = 16, className, ...props }: IconProps) => (
  <svg
    className={cn('fill-none stroke-2', className)}
    width={size}
    height={size}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M1 2H15M1 8H15M1 14H15" stroke="currentColor" strokeLinecap="round" />
  </svg>
);
