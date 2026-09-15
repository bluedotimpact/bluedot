import type React from 'react';
import { cn } from './utils';

export type TagProps = {
  children: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'accent' | 'status';
  shape?: 'rounded' | 'pill';
};

export const Tag: React.FC<TagProps> = ({
  className,
  children,
  tone = 'neutral',
  shape = 'rounded',
}) => {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 py-2 text-size-xxs font-semibold leading-snug [&>svg]:size-3.5 [&>svg]:shrink-0',
        shape === 'rounded' && 'rounded-surface px-4',
        shape === 'pill' && 'rounded-full px-3',
        tone === 'neutral' && 'border border-default text-secondary',
        tone === 'accent' && 'bg-accent-subtle text-accent',
        tone === 'status' && 'bg-accent-subtle text-secondary',
        className,
      )}
    >
      {children}
    </span>
  );
};

export default Tag;
