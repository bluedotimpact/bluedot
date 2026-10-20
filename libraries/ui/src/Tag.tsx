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
        'inline-flex w-fit items-center gap-1 py-2 text-size-xxs font-semibold leading-snug [&>svg]:size-3.5 [&>svg]:shrink-0',
        shape === 'rounded' && 'rounded-surface px-4',
        shape === 'pill' && 'rounded-full px-3',
        className,
      )}
    >
      {children}
    </span>
  );
};
