import React from 'react';
import clsx from 'clsx';

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

type BreadcrumbsProps = {
  route: BluedotRoute;
  className?: string;
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ route, className }) => {
  const items = [...(route.parentPages ?? []), route];

  return (
    <div className={clsx('breadcrumbs border-b border-color-divider w-full py-space-between', className)}>
      <nav
        className="breadcrumbs__nav section-base"
        aria-label="Breadcrumbs"
      >
        <ol className="breadcrumbs__list flex">
          {items.map((item, index) => (
            <li key={item.url} className="breadcrumbs__item flex items-center">
              <a className="breadcrumbs__link" href={item.url}>{item.title}</a>
              {index < items.length - 1 && (
                <span className="breadcrumbs__separator mx-2">{'>'}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumbs;
