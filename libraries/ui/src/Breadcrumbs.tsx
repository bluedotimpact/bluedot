import type React from 'react';
import clsx from 'clsx';
import { A } from './Text';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

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

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ route, children, className }) => {
  const items = [...(route.parentPages ?? []), route];

  return (
    <div className={clsx('bg-white border-bluedot-navy/10 py-2 w-full border-b', className)}>
      <nav className="section-base flex flex-row justify-between" aria-label="Breadcrumbs">
        <ol className="flex items-center gap-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.url} className="flex items-center gap-2">
                {isLast ? (
                  <span aria-current="page" className="text-bluedot-navy text-size-xs font-medium">
                    {item.title}
                  </span>
                ) : (
                  <A
                    className="text-bluedot-navy/70 hover:text-bluedot-navy text-size-xs font-medium no-underline"
                    href={item.url}
                  >
                    {item.title}
                  </A>
                )}
                {!isLast && <ChevronRightIcon size={16} aria-hidden="true" className="text-bluedot-navy/70 shrink-0" />}
              </li>
            );
          })}
        </ol>
        {children}
      </nav>
    </div>
  );
};

export default Breadcrumbs;
