import type React from 'react';
import { Children, isValidElement } from 'react';
import { ClickTarget } from './ClickTarget';
import { H3 } from './Text';

export type ListRowProps = {
  title: string;
  /** Whole row becomes the link; absolute URLs open in a new tab. Omit for a static row (no CTA, no hover). */
  href?: string;
  summary?: React.ReactNode;
  meta?: React.ReactNode;
  ctaLabel?: string;
};

const ROW_STYLES = 'flex flex-col gap-3 bd-md:flex-row bd-md:items-center bd-md:justify-between bd-md:gap-4';
const LINK_STYLES = 'group rounded-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus';
const ACCENT_BAR_STYLES = 'w-1 shrink-0 rounded-sm bg-accent-subtle transition-colors group-hover:bg-accent group-focus-visible:bg-accent';
// ml-5 lines the wrapped CTA up with the text column (bar 4px + gap 16px) below bd-md
const CTA_STYLES = 'ml-5 flex shrink-0 items-center text-size-xs font-semibold text-link transition-colors group-hover:text-link-hover bd-md:ml-0 bd-md:whitespace-nowrap';

export const ListRow = ({
  title,
  href,
  summary,
  meta,
  ctaLabel = 'Learn more',
}: ListRowProps) => {
  const isExternal = !!href && (href.startsWith('http://') || href.startsWith('https://'));

  const content = (
    <div className="flex min-w-0 flex-1 items-stretch gap-4">
      <div className={ACCENT_BAR_STYLES} />
      <div className="min-w-0 flex-1">
        <p className="text-size-md leading-snug font-semibold text-primary">
          {title}
          {isExternal && <span className="sr-only"> (opens in a new tab)</span>}
        </p>
        {summary && <div className="mt-1 text-size-sm leading-relaxed text-secondary">{summary}</div>}
        {meta && <div className="mt-1 text-size-xs leading-relaxed text-secondary">{meta}</div>}
      </div>
    </div>
  );

  if (!href) {
    return <div className={ROW_STYLES}>{content}</div>;
  }

  return (
    <ClickTarget url={href} target={isExternal ? '_blank' : undefined} className={`${ROW_STYLES} ${LINK_STYLES}`}>
      {content}
      <div className={CTA_STYLES}>
        <span className="transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1">
          {ctaLabel}
        </span>
        <span className="ml-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
          &rarr;
        </span>
      </div>
    </ClickTarget>
  );
};

export type ListGroupProps = {
  label?: string;
  children: React.ReactNode;
};

export const ListGroup = ({ label, children }: ListGroupProps) => {
  const items = Children.toArray(children).filter(isValidElement);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {label && <H3>{label}</H3>}
      <ul className="flex list-none flex-col divide-y divide-subtle">
        {items.map((child) => (
          <li key={child.key} className="py-4 first:pt-0 last:pb-0">{child}</li>
        ))}
      </ul>
    </div>
  );
};
