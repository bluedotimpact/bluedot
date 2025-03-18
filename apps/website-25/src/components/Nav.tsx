import clsx from 'clsx';
import React, {
  useCallback, useState, useEffect,
} from 'react';
import ClickAwayListener from 'react-click-away-listener';

import { CTALinkOrButton } from '@bluedot/ui/src/CTALinkOrButton';
import { HamburgerButton } from '@bluedot/ui/src/HamburgerButton';
import { ROUTES } from '../lib/routes';

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
  isScrolled?: boolean;
}> = ({
  expanded, innerClassName, className, courses, isScrolled,
}) => (
  <div
    className={clsx(
      'nav-explore-section__content-wrapper overflow-hidden transition-[max-height,opacity] duration-300',
      expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
      isScrolled && '[&_a]:link-on-dark',
      className,
    )}
  >
    <div
      className={clsx(
        'nav-explore-section___dropdown-content flex flex-col gap-[14px] text-pretty px-6',
        innerClassName,
      )}
    >
      <h3 className="nav-explore-section__dropdown-title font-bold">Our courses</h3>
      {courses?.map((course) => (
        <a key={course.href} href={course.href} tabIndex={expanded ? 0 : -1} className="nav-explore-section__dropdown-link">
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
  courses: Array<{ title: string; href: string; isNew?: boolean }>;
  exploreExpanded: boolean;
  onToggleExplore: () => void;
  className?: string;
  isScrolled: boolean;
}> = ({
  exploreSectionInline,
  courses,
  exploreExpanded,
  onToggleExplore,
  className,
  isScrolled,
}) => {
  const navLinkContainerClasses = clsx(
    'nav-links grid [&>*]:w-fit items-center',
    exploreSectionInline ? 'grid-cols-1 gap-y-9' : 'grid-cols-subgrid grid-rows-subgrid row-[1/3] col-[3/7]',
    className,
  );
  const navLinkClasses = clsx('nav-link-animation', isScrolled && 'nav-link-animation-dark');

  const exploreSection = (
    <ExploreSection
      expanded={exploreExpanded}
      courses={courses}
      className="nav-links__explore-section col-span-full row-[2]"
      innerClassName={exploreSectionInline ? 'pt-6' : 'pb-9'}
      isScrolled={isScrolled}
    />
  );

  return (
    <div className={navLinkContainerClasses}>
      <div>
        <button
          type="button"
          onClick={onToggleExplore}
          className={clsx('nav-links__dropdown-button flex items-center gap-2', navLinkClasses)}
        >
          Explore
          <DropdownIcon expanded={exploreExpanded} />
        </button>
        {exploreSectionInline && exploreSection}
      </div>
      {/* `exploreSection` is placed here in the DOM to make it the next step after "Explore"
          when tabbing through the header. Visually, it is moved below by setting row-[2] */}
      {!exploreSectionInline && exploreSection}
      <a href={ROUTES.about.url} className={clsx('nav-links__link', navLinkClasses, isCurrentPath(ROUTES.about.url) && 'font-bold')}>About us</a>
      <a href={ROUTES.joinUs.url} className={clsx('nav-links__link', navLinkClasses, isCurrentPath(ROUTES.joinUs.url) && 'font-bold')}>Join us</a>
      <a href="https://bluedot.org/blog/" className={clsx('nav-links__link', navLinkClasses)}>Blog</a>
    </div>
  );
};

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
  className, logo, courses,
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
        isScrolled ? 'bg-color-canvas-dark **:text-white' : 'bg-color-canvas',
        className,
      )}
    >
      <ClickAwayListener onClickAway={() => setExpandedSections('none')}>
        <div className="nav__container section-base">
          <div className="nav__bar w-full grid grid-cols-2 gap-x-9 lg:grid-cols-[20%_1fr_auto_auto_auto_auto_1fr_20%] items-center grid-rows-[72px] sm:grid-rows-[100px]">
            <a href="/" className="nav__logo-link shrink-0 w-[200px] col-[1]">
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
              isScrolled={isScrolled}
              className="nav__links--desktop hidden lg:grid mx-auto"
            />
            <div className="nav__actions flex gap-space-between ml-auto col-[8]">
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
              navExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <div className="nav__drawer-content--mobile-tablet flex flex-col grow font-medium pb-8 pt-2 lg:hidden">
              <NavLinks
                onToggleExplore={onToggleExplore}
                exploreExpanded={exploreExpanded}
                exploreSectionInline
                courses={courses}
                isScrolled={isScrolled}
                className="nav__links--mobile-tablet flex-col"
              />
              <CTAButtons className="nav__login--mobile justify-between mt-20 flex sm:hidden" />
            </div>
          </div>
        </div>
      </ClickAwayListener>
    </nav>
  );
};
