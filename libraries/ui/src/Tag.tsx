import type { ReactNode } from 'react';
import { cn } from './utils';

export type TagProps = {
  children: ReactNode;
  className?: string;
  shape?: 'rounded' | 'pill';
};

export const Tag = ({
  className,
  children,
  shape = 'rounded',
}: TagProps) => {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 whitespace-nowrap bg-accent-subtle text-size-xxs font-semibold leading-4 text-primary [&>svg]:size-3.5 [&>svg]:shrink-0',
        shape === 'rounded' && 'rounded-surface px-4 py-2',
        shape === 'pill' && 'rounded-full px-3 py-2.5',
        className,
      )}
    >
      {children}
    </span>
  );
};
