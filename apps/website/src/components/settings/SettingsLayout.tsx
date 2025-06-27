import React from 'react';
import { ClickTarget, NewText, BluedotRoute } from '@bluedot/ui';
import { H2 } from '../Text';
import clsx from 'clsx';

type SettingsTab = 'account' | 'courses' | 'community';

interface SettingsLayoutProps {
  activeTab: SettingsTab;
  children: React.ReactNode;
  route: BluedotRoute;
}

function SettingsLayout({ activeTab, children, route }: SettingsLayoutProps) {

  return (
    <>
      {/* Breadcrumbs */}
      <SettingsBreadcrumbs route={route} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left sidebar navigation */}
          <aside className="lg:col-span-3" aria-label="Settings sidebar">
            <H2 className="mb-6">Settings</H2>
            <SettingsNavigation activeTab={activeTab} />
          </aside>

          {/* Right content area */}
          <main className="lg:col-span-9" aria-label="Settings content">
            <div className="container-lined bg-white rounded-lg" role="region">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function SettingsNavigation({ activeTab }: { activeTab: SettingsTab }) {
  const navigationItems = [
    {
      id: 'account' as SettingsTab,
      label: 'Account',
      href: '/settings/account',
      showBullet: true,
    },
    {
      id: 'courses' as SettingsTab,
      label: 'Courses',
      href: '/settings/courses',
      showBullet: false,
    },
    {
      id: 'community' as SettingsTab,
      label: 'Community',
      href: '/settings/community',
      showBullet: false,
      isNew: true,
    },
  ];

  return (
    <nav aria-label="Settings navigation">
      <ul className="space-y-1">
        {navigationItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <li key={item.id}>
              <ClickTarget
                url={item.href}
                className={`
                  block px-4 py-2 rounded-md transition-colors
                  ${isActive 
                    ? 'bg-bluedot-lightest text-bluedot-dark' 
                    : 'text-bluedot-normal hover:bg-bluedot-lightest'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${item.label} settings${item.isNew ? ' (New feature)' : ''}`}
              >
                <span className="flex items-center gap-2">
                  {isActive && item.showBullet && (
                    <span className="text-bluedot-dark" aria-hidden="true">•</span>
                  )}
                  <span className={isActive ? 'font-bold' : ''}>
                    {item.label}
                  </span>
                  {item.isNew && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full uppercase font-semibold" aria-label="New feature">
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
}

function SettingsBreadcrumbs({ route }: { route: BluedotRoute }) {
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
            return (
              <li key={item.url} className="breadcrumbs__item flex items-center">
                <NewText.A 
                  className={clsx(
                    "breadcrumbs__link no-underline",
                    !isLast && "font-bold"
                  )} 
                  href={item.url}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.title}
                </NewText.A>
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
}

export default SettingsLayout;