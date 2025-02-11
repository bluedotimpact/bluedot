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
      {/* eslint-disable-next-line */}
      <div
        className="collapsible__header flex justify-between w-full cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        tabIndex={-1} // Clicking on the header is only for mouse users. Keyboard users will use the native functionality of the button below.
      >
        <h3 className="collapsible__title">{title}</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={title}
          className="collapsible__button flex items-center"
        >
          <svg
            className={clsx('collapsible__button-icon size-6 transition-transform', isExpanded ? 'rotate-180' : '')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <div
        className={clsx(
          'collapsible__content',
          isExpanded ? 'collapsible__content--expanded h-full opacity-100 mt-6' : 'collapsible__content--collapsed h-0 opacity-0',
        )}
        aria-hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
};
