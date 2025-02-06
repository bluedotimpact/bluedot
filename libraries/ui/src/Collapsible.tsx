import clsx from 'clsx';
import React, { useState } from 'react';

export type CollapsibleProps = React.PropsWithChildren<{
  // Required
  title: string,
  // Optional
  className?: string,
  children?: React.ReactNode;
}>;

export const Collapsible: React.FC<CollapsibleProps> = ({
  children, className, title,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={clsx('collapsible max-w-max-width border-b border-color-divider pb-10 my-10 last:border-none last:pb-0 last:my-6', className)}>
      <div className='collapsible__header flex justify-between w-full cursor-pointer' onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className='collapsible__title text-color-text text-2xl font-normal'>{title}</h3>
        <svg
              className={clsx('collapsible__icon size-6 transition-transform', isExpanded ? 'rotate-180' : '')}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div className={clsx(
        'collapsible__content',
        isExpanded ? 'h-full opacity-100 mt-6' : 'h-0 opacity-0',
      )}>
        {children}
      </div>
    </div>
  );
};
