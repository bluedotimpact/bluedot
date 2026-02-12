import clsx from 'clsx';
import type React from 'react';

export type CollapsibleProps = React.PropsWithChildren<{
  // Required
  title: string;
  // Optional
  className?: string;
  summaryClassName?: string;
  children?: React.ReactNode;
}>;

export const Collapsible: React.FC<CollapsibleProps> = ({
  children, className, summaryClassName, title,
}) => {
  return (
    <details className={clsx('collapsible max-w-max-width border-b border-color-divider py-4 last:border-b-0 group marker:hidden [&_summary::-webkit-details-marker]:hidden', className)}>
      <summary className={clsx('collapsible__header flex justify-between w-full cursor-pointer py-6 text-left', summaryClassName)}>
        <span className="collapsible__title bluedot-h4">{title}</span>
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
      <div className="collapsible__content pb-6">
        {children}
      </div>
    </details>
  );
};
