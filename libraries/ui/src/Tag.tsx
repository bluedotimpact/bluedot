import React from 'react';
import clsx from 'clsx';

export type TagProps = {
  className?: string,
  children: React.ReactNode;
};

export const Tag: React.FC<TagProps> = ({
  className,
  children,
}) => {
  return (
    <span
      role="status"
      className={clsx(
        'tag container-lined inline-flex items-center px-4 py-2 text-xs font-semibold text-color-secondary-text',
        className,
      )}
    >
      {children}
    </span>
  );
};

export default Tag;
