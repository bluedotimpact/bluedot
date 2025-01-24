import React from 'react';
import clsx from 'clsx';

export type TagProps = {
  className?: string,
  label: string;
};

export const Tag: React.FC<TagProps> = ({
  className,
  label,
}) => {
  return (
    <span
      role="status"
      className={clsx(
        'tag inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-semibold border border-bluedot-light',
        className,
      )}
    >
      {label}
    </span>
  );
};

export default Tag;
