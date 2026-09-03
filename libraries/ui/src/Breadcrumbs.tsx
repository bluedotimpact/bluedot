import type React from 'react';
import { A } from './Text';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { cn } from './utils';

export type BluedotRoute = {
  /**
   * Title of the page, by convention this is the title that appears in the
   * <title /> tag (e.g. "About us" in "About us | BlueDot Impact")
   */
  title: string;
  /**
   * Relative url of the route (e.g. /about, not https://bluedot.org/about)
   */
  url: string;
  /**
   * Parent pages of the route (to appear in the <Breadcrumbs /> component)
   */
  parentPages?: Pick<BluedotRoute, 'title' | 'url'>[];
};

export type BreadcrumbsProps = {
  // Required
  route: BluedotRoute;
  // Optional
  children?: React.ReactNode;
  className?: string;
};

export type BreadcrumbTrailProps = {
  route: BluedotRoute;
  className?: string;
};

/** The crumbs alone, for embedding in an existing bar. Use `Breadcrumbs` for the standalone full-width bar. */
export const BreadcrumbTrail: React.FC<BreadcrumbTrailProps> = ({ route, className }) => {
  const items = [...(route.parentPages ?? []), route];
  const collapsible = items.length > 2;

  return (
    <ol className={cn('text-size-xs flex min-w-0 items-center gap-2 leading-normal font-medium', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isMiddle = index > 0 && !isLast;

        return (
          <li key={item.url} className={cn('flex min-w-0 items-center gap-2', isMiddle && 'hidden bd-md:flex')}>
            {isLast ? (
              <span aria-current="page" title={item.title} className="text-bluedot-navy truncate">
                {item.title}
              </span>
            ) : (
              <A className="text-bluedot-navy/70 hover:text-bluedot-navy truncate no-underline" href={item.url}>
                {item.title}
              </A>
            )}
            {!isLast && <ChevronRightIcon size={16} aria-hidden="true" className="text-bluedot-navy/70 shrink-0" />}
            {index === 0 && collapsible && (
              <span aria-hidden="true" className="bd-md:hidden text-bluedot-navy/70 flex items-center gap-2">
                ⋯
                <ChevronRightIcon size={16} className="text-bluedot-navy/70 shrink-0" />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ route, children, className }) => (
  <div className={cn('border-bluedot-navy/10 w-full border-b bg-white py-3', className)}>
    <nav className="section-base flex flex-row justify-between" aria-label="Breadcrumbs">
      <BreadcrumbTrail route={route} />
      {children}
    </nav>
  </div>
);

export default Breadcrumbs;
