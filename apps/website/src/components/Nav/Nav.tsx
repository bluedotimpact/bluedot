import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { useAuthStore } from '@bluedot/ui';
import { useRouter } from 'next/router';

import { NavLogo } from './_NavLogo';
import { NavCta } from './_NavCta';
import { MobileNavLinks } from './_MobileNavLinks';
import { DesktopNavLinks } from './_DesktopNavLinks';
import { ExpandedSectionsState } from './utils';

export const Nav: React.FC = () => {
  const router = useRouter();
  const isLoggedIn = !!useAuthStore((s) => s.auth);
  const [isScrolled, setIsScrolled] = useState(false);
  const isHomepage = router.pathname === '/';
  const logo = isHomepage
    ? '/images/logo/BlueDot_Impact_Logo_White.svg'
    : '/images/logo/BlueDot_Impact_Logo.svg';

  const [expandedSections, setExpandedSections] = useState<ExpandedSectionsState>({
    about: false,
    explore: false,
    mobileNav: false,
    profile: false,
  });

  const updateExpandedSections = (updates: Partial<ExpandedSectionsState>) => {
    setExpandedSections((prev: ExpandedSectionsState) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle viewport breakpoint changes to reset dropdown states on mobile/desktop transitions
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    const handleBreakpointChange = () => {
      setExpandedSections({
        about: false,
        explore: false,
        mobileNav: false,
        profile: false,
      });
    };

    mediaQuery.addEventListener('change', handleBreakpointChange);
    return () => mediaQuery.removeEventListener('change', handleBreakpointChange);
  }, []);

  const getNavClasses = () => {
    if (isHomepage) {
      return clsx(
        'nav absolute top-0 inset-x-0 z-50 transition-all duration-300',
        'bg-transparent',
        'border-b border-white/15',
      );
    }
    return clsx(
      'nav sticky top-0 z-50 w-full transition-all duration-300',
      !isScrolled && [
        'bg-white',
        'border-b border-color-divider',
      ],
      isScrolled && [
        'bg-color-canvas-dark',
      ],
    );
  };

  return (
    <nav className={getNavClasses()}>
      <ClickAwayListener onClickAway={() => setExpandedSections({
        about: false,
        explore: false,
        mobileNav: false,
        profile: false,
      })}
      >
        <div className="nav__container section-base">
          <div className="nav__bar w-full flex justify-between items-center min-h-[60px] min-[680px]:max-[1023px]:min-h-[60px] min-[1024px]:min-h-[76px]">
            {/* Left side: Logo */}
            <div className="flex items-center">
              {/* Mobile & Tablet: Hamburger Button */}
              <MobileNavLinks
                expandedSections={expandedSections}
                updateExpandedSections={updateExpandedSections}
                isScrolled={isScrolled}
                isLoggedIn={isLoggedIn}
                isHomepage={isHomepage}
              />

              {/* Logo */}
              <NavLogo logo={logo} isScrolled={isScrolled} isHomepage={isHomepage} />
            </div>

            {/* Center/Right side: Nav Links and CTA */}
            <div className="flex items-center gap-12">
              {/* Desktop: Nav Links */}
              <DesktopNavLinks
                expandedSections={expandedSections}
                updateExpandedSections={updateExpandedSections}
                isScrolled={isScrolled}
                isHomepage={isHomepage}
              />

              {/* CTA Buttons */}
              <NavCta
                isLoggedIn={isLoggedIn}
                isScrolled={isScrolled}
                isHomepage={isHomepage}
                expandedSections={expandedSections}
                updateExpandedSections={updateExpandedSections}
              />
            </div>
          </div>
        </div>
      </ClickAwayListener>
    </nav>
  );
};

export default Nav;
