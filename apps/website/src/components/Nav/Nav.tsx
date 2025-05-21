import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { useAuthStore } from '@bluedot/ui';

import { NavLogo } from './_NavLogo';
import { NavCta } from './_NavCta';
import { MobileNavLinks } from './_MobileNavLinks';
import { DesktopNavLinks } from './_DesktopNavLinks';
import { ExpandedSectionsState, TRANSITION_DURATION_CLASS } from './utils';

export type NavProps = {
  className?: string;
  logo?: string;
};

export const Nav: React.FC<NavProps> = ({
  className,
  logo,
}) => {
  const isLoggedIn = !!useAuthStore((s) => s.auth);
  const [isScrolled, setIsScrolled] = useState(false);

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

  return (
    <nav
      className={clsx(
        `nav sticky top-0 z-50 w-full transition-all ${TRANSITION_DURATION_CLASS}`,
        isScrolled ? 'bg-color-canvas-dark **:text-white' : 'bg-white border-b border-color-divider',
        className,
      )}
    >
      <ClickAwayListener onClickAway={() => setExpandedSections({
        about: false,
        explore: false,
        mobileNav: false,
        profile: false,
      })}
      >
        <div className="nav__container section-base">
          <div className="nav__bar w-full flex justify-between items-center h-16">
            {/* Mobile & Tablet: Hamburger Button */}
            <MobileNavLinks
              expandedSections={expandedSections}
              updateExpandedSections={updateExpandedSections}
              isScrolled={isScrolled}
            />

            {/* Logo */}
            <NavLogo logo={logo} isScrolled={isScrolled} />

            {/* Desktop: Nav Links */}
            <DesktopNavLinks
              expandedSections={expandedSections}
              updateExpandedSections={updateExpandedSections}
              isScrolled={isScrolled}
            />

            {/* CTA Buttons */}
            <NavCta
              isLoggedIn={isLoggedIn}
              isScrolled={isScrolled}
              expandedSections={expandedSections}
              updateExpandedSections={updateExpandedSections}
            />
          </div>
        </div>
      </ClickAwayListener>
    </nav>
  );
};

export default Nav;
