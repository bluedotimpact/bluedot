import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { useAuthStore } from '@bluedot/ui';

import { NavLogo } from './_NavLogo';
import { SecondaryNavCta } from './_SecondaryNavCta';
import { LoginOrProfileCta } from './_LoginOrProfileCta';
import { MobileNavLinks } from './_MobileNavLinks';
import { DesktopNavLinks } from './_DesktopNavLinks';

export type NavProps = React.PropsWithChildren<{
  className?: string;
  logo?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  courses: {
    title: string;
    url: string;
    isNew?: boolean;
  }[];
}>;

export const TRANSITION_DURATION_CLASS = 'duration-300';

export const DRAWER_CLASSES = (isScrolled: boolean, isOpen: boolean) => clsx(
  `absolute top-[71px] left-0 w-full lg:-left-spacing-x lg:w-[calc(100%+(var(--spacing-x)*2))] lg:top-[92px] px-spacing-x pb-10 transition-[max-height,opacity] ${TRANSITION_DURATION_CLASS}`,
  isScrolled ? 'bg-color-canvas-dark' : 'bg-color-canvas',
  isOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0',
);

export const NAV_LINK_CLASSES = (isScrolled: boolean, isCurrentPath?: boolean) => 
  clsx('nav-link nav-link-animation no-underline', isScrolled && 'nav-link-animation-dark', isCurrentPath && 'font-bold');

export type ExpandedSectionsState = {
  mobileNav: boolean;
  explore: boolean;
  profile: boolean;
};

export const isCurrentPath = (url: string): boolean => {
  if (typeof window === 'undefined') return false;
  const currentPath = window.location.pathname;
  return url === currentPath || (url !== '/' && currentPath.startsWith(url));
};

export const Nav: React.FC<NavProps> = ({
  className, logo, courses,
}) => {
  const isLoggedIn = !!useAuthStore((s) => s.auth);
  const [isScrolled, setIsScrolled] = useState(false);

  const [expandedSections, setExpandedSections] = useState<ExpandedSectionsState>({
    mobileNav: false,
    explore: false,
    profile: false,
  });

  const updateExpandedSections = (updates: Partial<ExpandedSectionsState>) => {
    setExpandedSections(prev => ({ ...prev, ...updates }));
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
            <div className="mobile-nav-links__cta-buttons flex flex-row gap-6">
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