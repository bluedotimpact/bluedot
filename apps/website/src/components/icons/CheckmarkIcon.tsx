import { cn } from '@bluedot/ui';
import type { IconProps } from './types';

type CheckmarkIconProps = IconProps & {
  variant?: 'completed' | 'hover';
};

export const CheckmarkIcon = ({ size = 12, variant = 'completed', className, ...props }: CheckmarkIconProps) => (
  <svg
    viewBox="0 0 12 12"
    aria-hidden="true"
    width={size}
    height={size}
    className={cn(
      'fill-none',
      variant === 'completed' ? 'stroke-white stroke-[1.75]' : 'stroke-[rgba(42,45,52,0.6)] stroke-[1.5]',
      className,
    )}
    {...props}
  >
    <path d="M2.5 6L5 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
