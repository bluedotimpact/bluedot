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
    <div className={clsx('breadcrumbs bg-color-canvas border-b border-color-divider w-full py-space-between', className)}>
      <nav
        className="breadcrumbs__nav section-base flex flex-row justify-between"
        aria-label="Breadcrumbs"
      >
        <ol className="breadcrumbs__list flex">
          {items.map((item, index) => (
            <li key={item.url} className="breadcrumbs__item flex items-center">
              <A className="breadcrumbs__link no-underline" href={item.url}>{item.title}</A>
              {index < items.length - 1 && (
                <span className="breadcrumbs__separator mx-2">{'>'}</span>
              )}
            </li>
          ))}
        </ol>
        {children}
      </nav>
    </div>
  );
};

export default Breadcrumbs;
