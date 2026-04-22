import { cn } from '@bluedot/ui';
import type { IconProps } from './types';

type CheckmarkIconProps = IconProps & {
  variant?: 'completed' | 'hover';
};

export const CheckmarkIcon = ({ size = 12, variant = 'completed', className, ...props }: CheckmarkIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
    width={size}
    height={size}
    className={cn(variant === 'completed' ? 'text-white' : 'text-[rgba(42,45,52,0.6)]', className)}
    {...props}
  >
    <path
      d="M2.5 6L5 8.5L9.5 3.5"
      stroke="currentColor"
      strokeWidth={variant === 'completed' ? 1.75 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
