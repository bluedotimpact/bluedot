import type React from 'react';
import {
  A, type BluedotRoute, P,
} from '@bluedot/ui';
import clsx from 'clsx';
import MyBlueDotSidebar from './MyBlueDotSidebar';

type MyBlueDotLayoutProps = {
  children: React.ReactNode;
  route: BluedotRoute;
  afterBreadcrumbs?: React.ReactNode;
};

const MyBlueDotLayout = ({ children, route, afterBreadcrumbs }: MyBlueDotLayoutProps) => (
  <>
    <Breadcrumbs route={route} />
    {afterBreadcrumbs}

    <div className="section-base py-8">
      <div className="lg:flex lg:gap-8">
        <MyBlueDotSidebar />
        <section className="min-w-0 flex-1" aria-label="My BlueDot content">
          {children}
        </section>
      </div>
    </div>
  </>
);

const Breadcrumbs = ({ route }: { route: BluedotRoute }) => {
  const breadcrumbItems = [...(route.parentPages ?? []), route];

  return (
    <div className="breadcrumbs bg-color-canvas border-b border-color-divider w-full py-space-between">
      <nav
        className="breadcrumbs__nav section-base flex flex-row justify-between"
        aria-label="Breadcrumbs"
      >
        <ol className="breadcrumbs__list flex">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isSettingsItem = item.url === '/settings';

            return (
              <li key={item.url} className="breadcrumbs__item flex items-center">
                {isSettingsItem ? (
                  <P
                    className={clsx(
                      'breadcrumbs__link !m-0',
                      isLast && 'opacity-50',
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.title}
                  </P>
                ) : (
                  <A
                    className={clsx(
                      'breadcrumbs__link no-underline',
                      isLast && 'opacity-50',
                    )}
                    href={item.url}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.title}
                  </A>
                )}
                {!isLast && (
                  <span className="breadcrumbs__separator mx-2" aria-hidden="true">{'>'}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default MyBlueDotLayout;
