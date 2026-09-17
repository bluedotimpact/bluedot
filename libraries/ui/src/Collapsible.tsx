import type React from 'react';
import { cn } from './utils';

export type CollapsibleProps = React.PropsWithChildren<{
  title: string;
  className?: string;
  summaryClassName?: string;
}>;

export const Collapsible: React.FC<CollapsibleProps> = ({
  children, className, summaryClassName, title,
}) => {
  return (
    <details className={cn('max-w-max-width border-b border-default py-4 last:border-b-0 group marker:hidden [&_summary::-webkit-details-marker]:hidden', className)}>
      <summary className={cn('flex items-center justify-between cursor-pointer py-6 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus', summaryClassName)}>
        <span className="bluedot-h4">{title}</span>
        <svg
          aria-hidden="true"
          className="size-6 shrink-0 transition-transform motion-reduce:transition-none group-open:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="pb-6">
        {children}
      </div>
    </details>
  );
};
