import type React from 'react';
import clsx from 'clsx';

export type TagProps = {
  // Required
  children: React.ReactNode;
  // Optional
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
      role="status"
      className={clsx(
        'tag inline-flex items-center px-4 py-2 text-xs font-semibold w-fit',
        variant === 'default' && 'text-color-secondary-text container-lined',
        variant === 'secondary' && '!text-bluedot-normal bg-[#E5EDFE] rounded-sm',
        className,
      )}
    >
      {children}
    </span>
  );
};

export default Tag;
