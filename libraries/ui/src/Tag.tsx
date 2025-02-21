import React from 'react';
import clsx from 'clsx';

interface TagProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Tag = ({ children, onClick, className }: TagProps) => {
  const isClickable = !!onClick;

  const baseStyles = 'tag inline-flex items-center px-4 py-2 text-xs font-semibold';
  const variantStyles = isClickable
    ? 'rounded border border-bluedot-lighter cursor-pointer'
    : 'text-gray-900';

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return isClickable ? (
    <button
      className={clsx(baseStyles, variantStyles, className)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      type="button"
    >
      {children}
    </button>
  ) : (
    <div className={clsx(baseStyles, variantStyles, className)}>
      {children}
    </div>
  );
};

export default Tag;
