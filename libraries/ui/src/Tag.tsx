import React from 'react';
import clsx from 'clsx';

export type TagProps = {
  className?: string,
  children: React.ReactNode;
  dataTestId?: string;
};

export const Tag: React.FC<TagProps> = ({
  className,
  children,
  dataTestId,
}) => {
  return (
    <span
      role="status"
      className={clsx(
        'tag inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-semibold border border-bluedot-light',
        className,
      )}
      data-testid={dataTestId}
    >
      {children}
    </span>
  );
};

export default Tag;
