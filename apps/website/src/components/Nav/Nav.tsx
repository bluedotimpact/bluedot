import clsx from 'clsx';
import type React from 'react';
import { useState } from 'react';
import { useAuthStore } from '@bluedot/ui';
import { useRouter } from 'next/router';

import { NavLogo } from './_NavLogo';
import { NavCta } from './_NavCta';
import { MobileNavLinks } from './_MobileNavLinks';
import { NavLinks } from './_NavLinks';
import { ProfileLinks } from './_ProfileLinks';
import {
  CLOSED_MENU, type NavMenu, type NavMenuState, type NavSection,
} from './utils';

const NAV_BAR_CLASS = 'z-50 w-full';
const NAV_ROW_CLASS = 'w-full flex justify-between items-center min-h-(--nav-height-mobile) lg:min-h-(--nav-height-desktop)';

type NavProps =
  | {
    // Omitted: derived from the route (homepage → transparent)
    variant?: 'default' | 'transparent';
  }
  | {
    // Form pages: logo + title only. Profile menu still shows when logged in; auth CTAs never do.
    variant: 'minimal';
    title: string;
    context?: string;
  };

export const Nav: React.FC<NavProps> = (props) => {
  const router = useRouter();
  const isLoggedIn = !!useAuthStore((s) => s.auth);
  const isHomepage = router.pathname === '/' || router.pathname === '/courses';

  const [menuState, setMenuState] = useState<NavMenuState>(CLOSED_MENU);

  const menu: NavMenu = {
    ...menuState,
    toggleSection: (section: NavSection) => setMenuState((prev) => ({
      mobileNavOpen: section === 'profile' ? false : prev.mobileNavOpen,
      openSection: prev.openSection === section ? null : section,
    })),
    closeSection: () => setMenuState((prev) => ({ ...prev, openSection: null })),
    toggleMobileNav: () => setMenuState((prev) => ({ mobileNavOpen: !prev.mobileNavOpen, openSection: null })),
    closeAll: () => setMenuState(CLOSED_MENU),
  };

  if (props.variant === 'minimal') {
    return (
      <nav aria-label="Main" className={clsx(NAV_BAR_CLASS, 'sticky top-0 bg-canvas border-b border-strong')}>
        <div className="section-base">
          {/* Tight gaps below bd-md: logo + title + avatar only just fit in 390 − 2×24 page padding */}
          <div className={clsx(NAV_ROW_CLASS, 'gap-3 bd-md:gap-4')}>
            <div className="flex items-center gap-3 bd-md:gap-4 min-w-0">
              <NavLogo onColoredBackground={false} />
              <div className="h-[18px] w-px bg-strong shrink-0" aria-hidden="true" />
              <div className="flex items-center gap-2 text-size-xs min-w-0">
                <span className="font-semibold text-primary truncate">{props.title}</span>
                {props.context && (
                  <>
                    <span className="text-placeholder shrink-0 hidden bd-md:inline" aria-hidden="true">·</span>
                    <span className="font-medium text-secondary truncate hidden bd-md:inline" title={props.context}>{props.context}</span>
                  </>
                )}
              </div>
            </div>
            {isLoggedIn && <div className="shrink-0"><ProfileLinks menu={menu} /></div>}
          </div>
        </div>
      </nav>
    );
  }

  const variant = props.variant ?? (isHomepage ? 'transparent' : 'default');
  const isOnColoredBackground = variant === 'transparent';

  return (
    <nav
      aria-label="Main"
      className={clsx(
        NAV_BAR_CLASS,
        isOnColoredBackground
          ? 'absolute top-0 inset-x-0 bg-transparent border-b border-on-dark/15'
          : 'sticky top-0 bg-canvas border-b border-strong',
      )}
    >
      <div className="section-base">
        <div className={NAV_ROW_CLASS}>
          <div className="flex items-center gap-1.5">
            <MobileNavLinks
              menu={menu}
              isLoggedIn={isLoggedIn}
              onColoredBackground={isOnColoredBackground}
            />
            <NavLogo onColoredBackground={isOnColoredBackground} />
          </div>
          <div className="flex items-center gap-12">
            <NavLinks
              menu={menu}
              isOnDark={isOnColoredBackground}
              className="hidden xl:flex"
            />
            <NavCta
              menu={menu}
              isLoggedIn={isLoggedIn}
              onColoredBackground={isOnColoredBackground}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};
