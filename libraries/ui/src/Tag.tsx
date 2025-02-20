import React from 'react';
import clsx from 'clsx';

interface TagProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export const Tag = ({ children, onClick }: TagProps) => {
  const isClickable = !!onClick;

  const baseStyles = 'tag inline-flex items-center px-4 py-2 text-xs font-semibold';
  const variantStyles = isClickable
    ? 'rounded border border-[#CCD7FF] cursor-pointer hover:bg-blue-50'
    : 'text-gray-900';

  return (
    <div
      className={clsx(baseStyles, variantStyles)}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
    >
      {children}
    </div>
  );
};

export default Tag;
