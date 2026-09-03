import type React from 'react';
import clsx from 'clsx';
import { A } from './Text';

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
    <div className={clsx('bg-color-canvas border-color-divider py-space-between w-full border-b', className)}>
      <nav className="section-base flex flex-row justify-between" aria-label="Breadcrumbs">
        <ol className="flex">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.url} className="flex items-center">
                {isLast ? (
                  <span aria-current="page" className="text-bluedot-navy">
                    {item.title}
                  </span>
                ) : (
                  <A className="text-bluedot-navy/70 hover:text-bluedot-navy no-underline" href={item.url}>
                    {item.title}
                  </A>
                )}
                {!isLast && <span className="mx-2">{'>'}</span>}
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
