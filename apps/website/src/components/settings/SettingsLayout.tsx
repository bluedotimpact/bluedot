import React from 'react';
import { ClickTarget, NewText, BluedotRoute } from '@bluedot/ui';
import clsx from 'clsx';
import { H2 } from '../Text';

type SettingsTab = 'account' | 'courses' | 'community';

type SettingsLayoutProps = {
  activeTab: SettingsTab;
  children: React.ReactNode;
  route: BluedotRoute;
};

const SettingsLayout = ({ activeTab, children, route }: SettingsLayoutProps) => {
  return (
    <>
      {/* Breadcrumbs */}
      <SettingsBreadcrumbs route={route} />

      <div className="container mx-auto px-4 py-6">
        {/* Mobile and Tablet layout - horizontal navigation */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Navigation - horizontal on mobile/tablet, sidebar on desktop */}
          <aside className="lg:col-span-3 mb-6 lg:max-w-[320px]" aria-label="Settings sidebar">
            <H2 className="mb-4 font-semibold text-size-lg leading-[1.4]">Settings</H2>
            <SettingsNavigation activeTab={activeTab} />
          </aside>

          {/* Content area */}
          <main className="lg:col-span-9" aria-label="Settings content">
            <div className="container-lined" role="region">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

const SettingsNavigation = ({ activeTab }: { activeTab: SettingsTab }) => {
  const navigationItems = [
    {
      id: 'account' as SettingsTab,
      label: 'Account',
      href: '/settings/account',
    },
    {
      id: 'courses' as SettingsTab,
      label: 'Courses',
      href: '/settings/courses',
    },
    {
      id: 'community' as SettingsTab,
      label: 'Community',
      href: '/settings/community',
      isNew: true,
    },
  ];

  return (
    <nav aria-label="Settings navigation">
      <ul className="flex gap-2 flex-wrap lg:block lg:space-y-1">
        {navigationItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <li key={item.id}>
              <ClickTarget
                url={item.href}
                className={`
                  w-auto lg:w-full h-11 px-4 py-3 rounded-lg transition-colors flex items-center
                  ${isActive
                  ? 'bg-[rgba(0,85,255,0.08)] text-bluedot-darker font-semibold'
                  : 'text-bluedot-darker hover:bg-[rgba(0,85,255,0.04)]'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${item.label} settings${item.isNew ? ' (New feature)' : ''}`}
              >
                <span className="flex items-center gap-3 w-full">
                  <NewText.P className={`text-[13px] leading-[22px] flex-grow !m-0 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                    {item.label}
                  </NewText.P>
                  {item.isNew && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-[5px] uppercase font-bold bg-[rgba(0,85,255,0.08)] text-[#0037FF]"
                      aria-label="New feature"
                    >
                      NEW
                    </span>
                  )}
                </span>
              </ClickTarget>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

const SettingsBreadcrumbs = ({ route }: { route: BluedotRoute }) => {
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
                  <NewText.P
                    className={clsx(
                      'breadcrumbs__link !m-0',
                      isLast && 'opacity-50',
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.title}
                  </NewText.P>
                ) : (
                  <NewText.A
                    className={clsx(
                      'breadcrumbs__link no-underline',
                      isLast && 'opacity-50',
                    )}
                    href={item.url}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.title}
                  </NewText.A>
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

export default SettingsLayout;
