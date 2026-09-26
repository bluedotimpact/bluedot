import type { ComponentPropsWithoutRef } from 'react';
import { cn } from './utils';

export type IconButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'aria-label'> & {
  // Icon-only controls have no visible text, so the accessible name is mandatory
  'aria-label': string;
  variant?: 'ghost' | 'outline';
};

export const IconButton = ({ variant = 'ghost', className, ...props }: IconButtonProps) => (
  <button
    type="button"
    {...props}
    className={cn(
      'relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-surface hover:bg-tint',
      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
      'disabled:pointer-events-none disabled:opacity-40',
      // Extends the tap target to 44x44 around the 32px button without changing the footprint
      'before:absolute before:-inset-1.5',
      variant === 'outline' && 'border border-accent',
      className,
    )}
  />
);
