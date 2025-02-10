import clsx from 'clsx';
import React, {
  useCallback, useState, useEffect,
} from 'react';

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

const SearchIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="21.4853" cy="22.4853" r="6" transform="rotate(-45 21.4853 22.4853)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M27.1421 28.1421L30.6776 31.6776" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

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

const LoginButtons: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('nav__cta-container flex items-center', className)}>
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
        isScrolled ? 'bg-bluedot-darker' : 'bg-cream-normal',
        isScrolled && '[&_*]:text-white [&_a]:hover:text-bluedot-lighter [&_button]:hover:text-bluedot-lighter',
        className,
      )}
    >
      <div className="nav__container w-full max-w-max-width mx-auto px-3 sm:px-6 lg:px-9">
        <div className="nav__bar flex flex-grow justify-between items-center pl-3 h-[72px] sm:h-[100px]">
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
          <div className="nav__actions flex">
            <SearchIcon />
            <LoginButtons className="nav__login--tablet-desktop gap-6 ml-4 mr-2 hidden sm:flex" />
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
          <div className="nav__drawer-content--mobile-tablet flex flex-col flex-grow font-medium pb-8 pt-2 lg:hidden">
            <NavLinks
              onToggleExplore={onToggleExplore}
              exploreExpanded={exploreExpanded}
              exploreSectionInline
              courses={courses}
              className="nav__links--mobile-tablet flex-col"
            >
              {children}
            </NavLinks>
            <LoginButtons className="nav__login--mobile justify-between mt-20 sm:hidden" />
          </div>
        </div>
      </div>
    </nav>
  );
};
