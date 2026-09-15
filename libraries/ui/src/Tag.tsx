import type React from 'react';
import clsx from 'clsx';

export type TagProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary';
};

export const Tag: React.FC<TagProps> = ({
  className,
  children,
  variant = 'default',
}) => {
  return (
    <span
      className={clsx(
        'tag inline-flex items-center px-4 py-2 text-size-xxs leading-4 font-semibold w-fit',
        variant === 'default' && 'text-secondary container-lined',
        variant === 'secondary' && '!text-accent bg-[#E5EDFE] rounded-sm',
        className,
      )}
    >
      {children}
    </span>
  );
};

export default Tag;
