import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@bluedot/ui';
import { useRouter } from 'next/router';

import { NavLogo } from './_NavLogo';
import { NavCta } from './_NavCta';
import { MobileNavLinks } from './_MobileNavLinks';
import { DesktopNavLinks } from './_DesktopNavLinks';
import { ExpandedSectionsState } from './utils';

type NavProps = {
  variant?: 'default' | 'transparent' | 'colored';
  backgroundColor?: string;
};

export const Nav: React.FC<NavProps> = ({ variant: variantProp, backgroundColor }) => {
  const router = useRouter();
  const isLoggedIn = !!useAuthStore((s) => s.auth);
  const isHomepage = router.pathname === '/' || router.pathname === '/courses';

  // Determine variant: prop > homepage detection > default
  const variant = variantProp ?? (isHomepage ? 'transparent' : 'default');
  const isDarkVariant = variant === 'transparent' || variant === 'colored';

  const [expandedSections, setExpandedSections] = useState<ExpandedSectionsState>({
    about: false,
    explore: false,
    mobileNav: false,
    profile: false,
  });

  const updateExpandedSections = (updates: Partial<ExpandedSectionsState>) => {
    setExpandedSections((prev: ExpandedSectionsState) => ({ ...prev, ...updates }));
  };

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
    if (variant === 'transparent') {
      return clsx(
        'nav absolute top-0 inset-x-0 z-50 w-full transition-all duration-300',
        'bg-transparent',
        'border-b border-white/15',
      );
    }
    if (variant === 'colored') {
      return clsx(
        'nav sticky top-0 z-50 w-full transition-all duration-300',
        'border-b border-white/15',
      );
    }
    return clsx(
      'nav sticky top-0 z-50 w-full transition-all duration-300',
      'bg-white',
      'border-b border-color-divider',
    );
  };

  const navStyle = variant === 'colored' && backgroundColor ? { backgroundColor } : undefined;

  return (
    <nav className={getNavClasses()} style={navStyle}>
      <div className="nav__container section-base">
        <div className="nav__bar w-full flex justify-between items-center min-h-(--nav-height-mobile) min-[1024px]:min-h-(--nav-height-desktop)">
          {/* Left side: Logo */}
          <div className="flex items-center">
            {/* Mobile & Tablet: Hamburger Button */}
            <MobileNavLinks
              expandedSections={expandedSections}
              updateExpandedSections={updateExpandedSections}
              isLoggedIn={isLoggedIn}
              isHomepage={isDarkVariant}
            />

            {/* Logo */}
            <NavLogo isHomepage={isDarkVariant} />
          </div>

          {/* Center/Right side: Nav Links and CTA */}
          <div className="flex items-center gap-12">
            {/* Desktop: Nav Links */}
            <DesktopNavLinks
              expandedSections={expandedSections}
              updateExpandedSections={updateExpandedSections}
              isHomepage={isDarkVariant}
            />

            {/* CTA Buttons */}
            <NavCta
              isLoggedIn={isLoggedIn}
              isHomepage={isDarkVariant}
              expandedSections={expandedSections}
              updateExpandedSections={updateExpandedSections}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
