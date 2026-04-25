import type React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { CTALinkOrButton } from '@bluedot/ui';

export type PageListRowProps = {
  href: string;
  title: string;
  summary?: React.ReactNode;
  meta?: React.ReactNode;
  ctaLabel?: string;
  external?: boolean;
  leadingSlot?: React.ReactNode;
  /**
   * When true (default), the entire row is a single clickable link.
   * When false, only the title text and trailing CTA are clickable —
   * use this when the row contains other interactive elements (e.g. a
   * description toggle) so we don't nest interactives inside an anchor.
   */
  fullyClickable?: boolean;
  children?: React.ReactNode;
};

const wrapperClassName = 'group flex flex-col gap-3 min-[680px]:flex-row min-[680px]:items-center min-[680px]:justify-between min-[680px]:gap-6';

const accentBarClassName = clsx(
  'w-1 flex-shrink-0 rounded-sm bg-bluedot-normal/30 transition-colors',
  'group-hover:bg-bluedot-normal group-focus-within:bg-bluedot-normal',
);

const arrowCtaClassName = 'ml-5 flex shrink-0 items-center text-[15px] leading-[1.6] font-medium text-bluedot-normal min-[680px]:ml-6 min-[680px]:whitespace-nowrap';

export const pageSectionHeadingClass = 'text-[24px] font-bold tracking-[-0.4px] leading-[1.333] text-bluedot-navy';

const titleClassName = 'text-[15px] leading-[1.45] font-semibold text-bluedot-navy';
const summaryClassName = 'mt-1 text-[15px] leading-[1.6] text-bluedot-navy/62';
const metaClassName = 'mt-1 text-[15px] leading-[1.6] text-bluedot-navy/50';

export const PageListRow: React.FC<PageListRowProps> = ({
  href,
  title,
  summary,
  meta,
  ctaLabel = 'Learn more',
  external = false,
  leadingSlot,
  fullyClickable = true,
  children,
}) => {
  const linkProps = external
    ? { href, target: '_blank', rel: 'noopener noreferrer' as const }
    : null;

  if (fullyClickable) {
    const innerContent = (
      <>
        <div className="flex items-stretch gap-4 min-w-0 flex-1">
          <div className={accentBarClassName} />
          {leadingSlot}
          <div className="min-w-0 flex-1">
            <p className={titleClassName}>{title}</p>
            {summary && <p className={summaryClassName}>{summary}</p>}
            {meta && <p className={metaClassName}>{meta}</p>}
            {children && <div className="mt-2">{children}</div>}
          </div>
        </div>

        <div className={arrowCtaClassName}>
          <span className="transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1">
            {ctaLabel}
          </span>
          <span className="ml-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            &rarr;
          </span>
        </div>
      </>
    );

    if (external) {
      return (
        <a {...linkProps!} className={wrapperClassName}>
          {innerContent}
        </a>
      );
    }

    return (
      <Link href={href} className={wrapperClassName}>
        {innerContent}
      </Link>
    );
  }

  // Non-clickable wrapper: title is a link, trailing CTA is a button-styled link.
  // Use this when the row has other interactive children (e.g. a toggle button).
  const titleLinkClass = clsx(titleClassName, 'transition-colors hover:text-bluedot-normal');
  const titleLink = external
    ? <a {...linkProps!} className={titleLinkClass}>{title}</a>
    : <Link href={href} className={titleLinkClass}>{title}</Link>;

  return (
    <div className={wrapperClassName}>
      <div className="flex items-stretch gap-4 min-w-0 flex-1">
        <div className={accentBarClassName} />
        {leadingSlot}
        <div className="min-w-0 flex-1">
          {titleLink}
          {summary && <p className={summaryClassName}>{summary}</p>}
          {meta && <p className={metaClassName}>{meta}</p>}
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>

      <div className="ml-5 shrink-0 min-[680px]:ml-6">
        <CTALinkOrButton
          url={href}
          target={external ? '_blank' : undefined}
          variant="secondary"
          withChevron
        >
          {ctaLabel}
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export type PageListGroupProps = {
  label?: string;
  children: React.ReactNode[];
  className?: string;
};

export const PageListGroup: React.FC<PageListGroupProps> = ({ label, children, className }) => {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={clsx('flex flex-col gap-6', className)}>
      {label && (
        <h3 className={pageSectionHeadingClass}>
          {label}
        </h3>
      )}

      <ul className="list-none flex flex-col gap-5">
        {items.map((child, index) => {
          const key = (child as React.ReactElement)?.key ?? `row-${index}`;
          return (
            <li key={key}>
              {child}
              {index < items.length - 1 && (
                <div className="relative mt-5">
                  <div className="absolute inset-x-0 h-px bg-bluedot-navy/10" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PageListRow;
