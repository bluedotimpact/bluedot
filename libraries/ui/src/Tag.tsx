import type React from 'react';
import clsx from 'clsx';

export type TagProps = {
  children: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'accent';
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
      className={clsx(
        'inline-flex w-fit items-center gap-1 py-2 text-size-xxs font-semibold leading-snug [&>svg]:size-3.5 [&>svg]:shrink-0',
        shape === 'rounded' && 'rounded-surface px-4',
        shape === 'pill' && 'rounded-full px-3',
        tone === 'neutral' && 'border border-default text-secondary',
        tone === 'accent' && 'bg-accent-subtle text-accent',
        className,
      )}
    >
      {children}
    </span>
  );
};

export default Tag;
