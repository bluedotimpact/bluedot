import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from './utils';

export type IconButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'aria-label'> & {
  // Icon-only controls have no visible text, so the accessible name is mandatory
  'aria-label': string;
  variant?: 'ghost' | 'outline';
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ variant = 'ghost', className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    {...props}
    className={cn(
      'relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-surface hover:bg-tint on-dark:text-on-dark on-dark:hover:bg-surface-on-dark-subtle',
      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus on-dark:focus-visible:outline-focus-on-dark',
      'disabled:pointer-events-none disabled:opacity-40',
      // Extends the tap target to 44x44 around the 32px button without changing the footprint
      'before:absolute before:-inset-1.5',
      variant === 'outline' && 'border border-accent',
      className,
    )}
  />
));
IconButton.displayName = 'IconButton';
