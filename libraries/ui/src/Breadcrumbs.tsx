import React from 'react';
import clsx from 'clsx';

type BreadcrumbsProps = {
  items: Array<{
    title: string;
    url: string;
  }>;
  className?: string;
};

// TODO: flag that py-space-between and default font is also an option
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <div className={clsx('breadcrumbs border-b border-color-divider w-full py-3', className)}>
      <nav
        className="breadcrumbs__nav section-base"
        aria-label="Breadcrumbs"
      >
        <ol className="breadcrumbs__list flex">
          {items.map((item, index) => (
            <li key={item.url} className="breadcrumbs__item flex items-center text-size-xs">
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
