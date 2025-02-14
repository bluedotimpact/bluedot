import clsx from 'clsx';
import React, {
  useCallback, useState, useEffect,
} from 'react';
import ClickAwayListener from 'react-click-away-listener';

import { CTALinkOrButton } from './CTALinkOrButton';
import { HamburgerButton } from './HamburgerButton';

export type NavProps = React.PropsWithChildren<{
  className?: string;
  logo?: string;
  courses: Array<{
    title: string;
    href: string;
    isNew?: boolean;
  }>;
}>;

const DropdownIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    className={clsx('size-4 transition-transform', expanded ? 'rotate-180' : '')}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ExploreSection: React.FC<{
  expanded: boolean;
  innerClassName?: string;
  className?: string;
  courses: Array<{ title: string; href: string; isNew?: boolean }>;
}> = ({
  expanded, innerClassName, className, courses,
}) => (
  <div
    className={clsx(
      'nav-explore-section__content-wrapper overflow-hidden transition-[max-height,opacity] duration-300',
      expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
      className,
    )}
  >
    <div
      className={clsx(
        'nav-explore-section___dropdown-content flex flex-col gap-[14px] w-fit overflow-hidden text-pretty',
        innerClassName,
      )}
    >
      <h3 className="nav-explore-section__dropdown-title font-bold">Our courses</h3>
      {courses?.map((course) => (
        <a key={course.href} href={course.href} className="nav-explore-section__dropdown-link">
          {course.isNew && (
            <span className="nav-explore-section__new-badge text-bluedot-normal font-black pr-2">
              New!
            </span>
          )}
          {course.title}
        </a>
      ))}
    </div>
  </div>
);

const NavLinks: React.FC<{
  exploreSectionInline?: boolean;
  children: React.ReactNode;
  courses: Array<{ title: string; href: string; isNew?: boolean }>;
  exploreExpanded: boolean;
  onToggleExplore: () => void;
  className?: string;
}> = ({
  exploreSectionInline, children, courses, exploreExpanded, onToggleExplore, className,
}) => (
  <div className={clsx('nav-links flex gap-9', className)}>
    <div>
      <button
        type="button"
        onClick={onToggleExplore}
        className="nav-links__dropdown-button flex items-center gap-2 hover:text-bluedot-normal"
      >
        Explore
        <DropdownIcon expanded={exploreExpanded} />
      </button>
      {exploreSectionInline && (
        <ExploreSection
          expanded={exploreExpanded}
          courses={courses}
          className="nav-links__explore-section"
          innerClassName="pl-6 pt-6"
        />
      )}
    </div>
    {children}
  </div>
);

const CTAButtons: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('nav__cta-container', className)}>
    <CTALinkOrButton
      className="nav__primary-cta"
      url="https://donate.stripe.com/5kA3fpgjpdJv6o89AA"
      isExternalUrl
    >
      Support us
    </CTALinkOrButton>
    {/*
      TODO Potentially switch from "Support us" to "Log in"/"Get started for free" for non-MVP site
      <a className="nav__secondary-cta" href="https://course.aisafetyfundamentals.com/alignment?show=login" {...EXTERNAL_LINK_PROPS}>Log in</a>
      <CTALinkOrButton className="nav__primary-cta" url="https://aisafetyfundamentals.com/" {...EXTERNAL_LINK_PROPS}>Get started for free</CTALinkOrButton>
    */}
  </div>
);

export const isCurrentPath = (href: string): boolean => {
  if (typeof window === 'undefined') return false;
  const currentPath = window.location.pathname;
  return href === currentPath || (href !== '/' && currentPath.startsWith(href));
};

export const Nav: React.FC<NavProps> = ({
  children, className, logo, courses,
}) => {
  const [expandedSections, setExpandedSections] = useState<'none' | 'nav' | 'nav-and-explore'>('none');
  const navExpanded = expandedSections === 'nav' || expandedSections === 'nav-and-explore';
  const exploreExpanded = expandedSections === 'nav-and-explore';

  const [isScrolled, setIsScrolled] = useState(false);

  const onToggleExplore = useCallback(() => {
    setExpandedSections((prev) => (prev === 'nav-and-explore' ? 'nav' : 'nav-and-explore'));
  }, []);

  const onToggleNav = useCallback(() => {
    setExpandedSections((prev) => (prev === 'none' ? 'nav' : 'none'));
  }, []);

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
        'nav fixed z-50 w-full container-elevated transition-all duration-300',
        isScrolled ? 'bg-color-canvas-dark' : 'bg-color-canvas',
        isScrolled && '**:text-white [&_a:hover]:text-bluedot-lighter [&_button:hover]:text-bluedot-lighter',
        className,
      )}
    >
      <ClickAwayListener onClickAway={() => setExpandedSections('none')}>
        <div className="nav__container section-base">
          <div className="nav__bar flex grow justify-between items-center h-[72px] sm:h-[100px]">
            <a href="/" className="nav__logo-link shrink-0 w-[200px]">
              {logo ? (
                <img
                  className={clsx(
                    'nav__logo h-6 mr-auto transition-all duration-300',
                    isScrolled && 'brightness-0 invert',
                  )}
                  src={logo}
                  alt="BlueDot Impact Logo"
                />
              ) : (
                <h3 className="nav_logo--placeholder h-8 mr-auto">BlueDot Impact</h3>
              )}
            </a>
            <NavLinks
              onToggleExplore={onToggleExplore}
              exploreExpanded={exploreExpanded}
              courses={courses}
              className="nav__links--desktop hidden lg:flex"
            >
              {children}
            </NavLinks>
            <div className="nav__actions flex gap-space-between">
              <CTAButtons className="nav__login--tablet-desktop gap-6 hidden sm:flex" />
              <HamburgerButton
                open={navExpanded}
                setOpen={onToggleNav}
                className="nav__menu--mobile-tablet lg:hidden"
              />
            </div>
          </div>

          <div
            className={clsx(
              'nav__drawer transition-[max-height,opacity] duration-300 relative overflow-hidden px-3',
              navExpanded ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            {/* Desktop Explore section */}
            <ExploreSection
              expanded={exploreExpanded}
              courses={courses}
              className="nav__drawer-content--desktop"
              innerClassName="pb-10 hidden lg:flex mx-auto"
            />
            {/* Mobile & Tablet content (including Explore) */}
            <div className="nav__drawer-content--mobile-tablet flex flex-col grow font-medium pb-8 pt-2 lg:hidden">
              <NavLinks
                onToggleExplore={onToggleExplore}
                exploreExpanded={exploreExpanded}
                exploreSectionInline
                courses={courses}
                className="nav__links--mobile-tablet flex-col"
              >
                {children}
              </NavLinks>
              <CTAButtons className="nav__login--mobile justify-between mt-20 flex sm:hidden" />
            </div>
          </div>
        </div>
      </ClickAwayListener>
    </nav>
  );
};
