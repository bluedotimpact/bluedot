import React from 'react';
import clsx from 'clsx';
import type { BluedotRoute } from './utils';

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
