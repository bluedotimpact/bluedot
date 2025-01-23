import React from 'react';
import clsx from 'clsx';

export type TagProps = {
  className?: string,
  label: string;
  onClick?: () => void;
};

export const Tag: React.FC<TagProps> = ({
  className,
  label,
  onClick,
}) => {
  const baseStyles = 'tag inline-flex items-center px-4 py-1.5 rounded-lg border border-bluedot-light'
    + 'text-gray-800 text-sm font-medium transition-colors duration-200';

  const interactiveStyles = 'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          'tag__button',
          baseStyles,
          interactiveStyles,
          className,
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      role="status"
      className={clsx(
        'tag__label',
        baseStyles,
        className,
      )}
    >
      {label}
    </span>
  );
};

export default Tag;
