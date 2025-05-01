import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { useAuthStore } from '@bluedot/ui';

import { NavLogo } from './_NavLogo';
import { SecondaryNavCta } from './_SecondaryNavCta';
import { LoginOrProfileCta } from './_LoginOrProfileCta';
import { MobileNavLinks } from './_MobileNavLinks';
import { DesktopNavLinks } from './_DesktopNavLinks';
import { ExpandedSectionsState, TRANSITION_DURATION_CLASS } from './utils';

export type NavProps = {
  className?: string;
  logo?: string;
  courses: {
    title: string;
    url: string;
    isNew?: boolean;
  }[];
};

export const Nav: React.FC<NavProps> = ({
  className,
  logo,
  courses,
}) => {
  const isLoggedIn = !!useAuthStore((s) => s.auth);
  const [isScrolled, setIsScrolled] = useState(false);

  const [expandedSections, setExpandedSections] = useState<ExpandedSectionsState>({
    mobileNav: false,
    explore: false,
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

  return (
    <nav
      className={clsx(
        `nav sticky top-0 z-50 w-full container-elevated transition-all ${TRANSITION_DURATION_CLASS}`,
        isScrolled ? 'bg-color-canvas-dark **:text-white' : 'bg-color-canvas',
        className,
      )}
    >
      <ClickAwayListener onClickAway={() => setExpandedSections({ mobileNav: false, explore: false, profile: false })}>
        <div className="relative nav__container section-base">
          <div className="nav__bar w-full flex justify-between items-center h-[72px] sm:h-[100px]">
            {/* Mobile & Tablet: Hamburger Button */}
            <MobileNavLinks
              expandedSections={expandedSections}
              updateExpandedSections={updateExpandedSections}
              courses={courses}
              isScrolled={isScrolled}
              isLoggedIn={isLoggedIn}
            />

            {/* Logo */}
            <NavLogo logo={logo} isScrolled={isScrolled} />

            {/* Desktop: Nav Links */}
            <DesktopNavLinks
              expandedSections={expandedSections}
              updateExpandedSections={updateExpandedSections}
              courses={courses}
              isScrolled={isScrolled}
            />

            {/* CTA Buttons */}
            <div className="nav__cta-container flex flex-row items-center gap-6">
              <SecondaryNavCta className="hidden lg:block" />
              <LoginOrProfileCta
                isLoggedIn={isLoggedIn}
                isScrolled={isScrolled}
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
