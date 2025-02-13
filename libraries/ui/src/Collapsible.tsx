import clsx from 'clsx';
import React from 'react';

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
  return (
    <details className={clsx('collapsible max-w-max-width border-b border-color-divider pb-10 my-10 last:border-none last:pb-0 last:my-6 group', className)}>
      <summary className="collapsible__header flex justify-between w-full cursor-pointer list-none">
        <span className="collapsible__title subtitle-sm">{title}</span>
        <span className="collapsible__button flex items-center">
          <svg
            className="collapsible__button-icon size-6 transition-transform group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>
      <div className="collapsible__content mt-6">
        {children}
      </div>
    </details>
  );
};
