import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { FaCircleUser } from 'react-icons/fa6';
import ClickAwayListener from 'react-click-away-listener';

import { CTALinkOrButton } from '@bluedot/ui/src/CTALinkOrButton';
import { IconButton, HamburgerIcon } from '@bluedot/ui/src/IconButton';
import { useAuthStore, addQueryParam } from '@bluedot/ui';
import { ROUTES } from '../lib/routes';
import { A, H3 } from './Text';

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

const TRANSITION_DURATION_CLASS = 'duration-300';

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
  courses: { title: string; url: string; isNew?: boolean }[];
  isScrolled?: boolean;
}> = ({
  expanded, innerClassName, className, courses, isScrolled,
}) => (
  <div
    className={clsx(
      `nav-explore-section__content-wrapper overflow-hidden transition-[max-height,opacity] ${TRANSITION_DURATION_CLASS}`,
      expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
      isScrolled && '[&_a]:link-on-dark',
      className,
    )}
  >
    <div
      className={clsx(
        'nav-explore-section___dropdown-content flex flex-col gap-[14px] w-fit overflow-hidden text-pretty',
        innerClassName,
      )}
    >
      <H3 className="nav-explore-section__dropdown-title font-bold">Our courses</H3>
      {courses?.map((course) => (
        <A key={course.url} href={course.url} className="nav-explore-section__dropdown-link no-underline">
          {course.isNew && (
            <span className="nav-explore-section__new-badge text-bluedot-normal font-black pr-2">
              New!
            </span>
          )}
          {course.title}
        </A>
      ))}
    </div>
  </div>
);

const NavLinks: React.FC<{
  exploreSectionInline?: boolean;
  courses: { title: string; url: string; isNew?: boolean }[];
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
  const navLinkClasses = clsx('nav-link-animation no-underline', isScrolled && 'nav-link-animation-dark');

  return (
    <div className={clsx('nav-links flex gap-9 [&>*]:w-fit', className)}>
      <div>
        <button
          type="button"
          onClick={onToggleExplore}
          className={clsx('nav-links__dropdown-button flex items-center gap-2 cursor-pointer', navLinkClasses)}
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
            isScrolled={isScrolled}
          />
        )}
      </div>
      <A href={ROUTES.about.url} className={clsx('nav-links__link', navLinkClasses, isCurrentPath(ROUTES.about.url) && 'font-bold')}>About us</A>
      <A href={ROUTES.joinUs.url} className={clsx('nav-links__link', navLinkClasses, isCurrentPath(ROUTES.joinUs.url) && 'font-bold')}>Join us</A>
      <A href={ROUTES.blog.url} className={clsx('nav-links__link', navLinkClasses, isCurrentPath(ROUTES.blog.url) && 'font-bold')}>Blog</A>
      <A href="https://lu.ma/aisafetycommunityevents?utm_source=website&utm_campaign=nav" className={clsx('nav-links__link', navLinkClasses)}>Events</A>
    </div>
  );
};

const ProfileLinks: React.FC<{ isScrolled: boolean }> = ({ isScrolled }) => {
  const linkClasses = clsx('nav-link-animation w-fit no-underline', isScrolled && 'nav-link-animation-dark');

  return (
    <div className="nav__profile-dropdown flex flex-col gap-4 font-medium pb-10 items-end">
      <A href={ROUTES.profile.url} className={clsx('nav__profile-link', linkClasses)}>Profile</A>
      <A href={ROUTES.contact.url} className={clsx('nav__profile-link', linkClasses)}>Help</A>
      <A href={ROUTES.logout.url} className={clsx('nav__profile-link', linkClasses)}>Log out</A>
    </div>
  );
};

const CTAButtons: React.FC<{
  className?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  isLoggedIn: boolean;
}> = ({
  className,
  primaryCtaText = 'Support us',
  primaryCtaUrl = 'https://donate.stripe.com/5kA3fpgjpdJv6o89AA',
  isLoggedIn,
}) => {
  const [loginUrl, setLoginUrl] = useState(ROUTES.login.url);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoginUrl(addQueryParam(ROUTES.login.url, 'redirect_to', window.location.pathname));
    }
  }, []);

  return (
    <div className={clsx('nav__cta-container', className)}>
      {!isLoggedIn && (
        <CTALinkOrButton
          className="nav__secondary-cta"
          variant="secondary"
          url={loginUrl}
        >
          Login
        </CTALinkOrButton>
      )}
      <CTALinkOrButton
        className="nav__primary-cta"
        variant="primary"
        url={primaryCtaUrl}
      >
        {primaryCtaText}
      </CTALinkOrButton>
    </div>
  );
};

type ExpandedSectionsState = {
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
  className, logo, courses, primaryCtaText, primaryCtaUrl,
}) => {
  const [expandedSections, setExpandedSections] = useState<ExpandedSectionsState>({
    mobileNav: false,
    explore: false,
    profile: false,
  });

  const anyDrawerOpen = Object.values(expandedSections).some((v) => v);

  const isLoggedIn = !!useAuthStore((s) => s.auth);
  const [isScrolled, setIsScrolled] = useState(false);

  const onToggleExplore = () => setExpandedSections((prev) => ({
    mobileNav: prev.mobileNav,
    explore: !prev.explore,
    profile: false,
  }));

  const onToggleNav = () => setExpandedSections((prev) => ({
    mobileNav: !prev.mobileNav,
    explore: false,
    profile: false,
  }));

  const onToggleProfile = () => setExpandedSections((prev) => ({
    mobileNav: false,
    explore: false,
    profile: !prev.profile,
  }));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const drawerBaseClassName = 'transition-[max-height,opacity] relative overflow-hidden px-3';
  const drawerClosedClassName = `max-h-0 opacity-0 ${
    anyDrawerOpen ? 'duration-0' : TRANSITION_DURATION_CLASS
  }`; // Close instantly if any other drawer has been opened
  const drawerOpenClassName = `max-h-[700px] opacity-100 ${TRANSITION_DURATION_CLASS}`;

  return (
    <nav
      className={clsx(
        `nav sticky top-0 z-50 w-full container-elevated transition-all ${TRANSITION_DURATION_CLASS}`,
        isScrolled ? 'bg-color-canvas-dark **:text-white' : 'bg-color-canvas',
        className,
      )}
    >
      <ClickAwayListener onClickAway={() => setExpandedSections({ mobileNav: false, explore: false, profile: false })}>
        <div className="nav__container section-base">
          <div className="nav__bar w-full flex justify-between lg:grid lg:grid-cols-[20%_60%_20%] items-center h-[72px] sm:h-[100px]">
            <div className="flex gap-space-between items-center">
              <IconButton
                open={expandedSections.mobileNav}
                Icon={<HamburgerIcon />}
                setOpen={onToggleNav}
                className="nav__menu--mobile-tablet mr-2 lg:hidden"
              />
              <A href="/" className="nav__logo-link shrink-0 w-[200px] no-underline">
                {logo ? (
                  <img
                    className={clsx(
                      `nav__logo h-6 mr-auto transition-all ${TRANSITION_DURATION_CLASS}`,
                      isScrolled && 'brightness-0 invert',
                    )}
                    src={logo}
                    alt="BlueDot Impact Logo"
                  />
                ) : (
                  <H3 className="nav_logo--placeholder h-8 mr-auto">BlueDot Impact</H3>
                )}
              </A>
            </div>
            <NavLinks
              onToggleExplore={onToggleExplore}
              exploreExpanded={expandedSections.explore}
              courses={courses}
              isScrolled={isScrolled}
              className="nav__links--desktop hidden lg:flex mx-auto"
            />
            <div className="nav__actions flex gap-space-between ml-auto items-center">
              <CTAButtons
                primaryCtaText={primaryCtaText}
                primaryCtaUrl={primaryCtaUrl}
                isLoggedIn={isLoggedIn}
                className="nav__login--tablet-desktop gap-6 hidden sm:flex"
              />
              {isLoggedIn ? (
                <IconButton
                  open={expandedSections.profile}
                  Icon={<FaCircleUser className="size-[24px] opacity-75" />}
                  setOpen={onToggleProfile}
                  className="nav__profile-menu ml-2"
                />
              ) : (
                <CTALinkOrButton
                className="nav__login--mobile block sm:hidden"
                variant="secondary"
                url={ROUTES.login.url}
              >
                Login
              </CTALinkOrButton>
              )}
            </div>
          </div>
          <ExploreSection
            expanded={expandedSections.explore}
            courses={courses}
            className="nav__drawer-content--desktop"
            innerClassName="pb-10 hidden lg:flex mx-auto"
            isScrolled={isScrolled}
          />
          <div className={clsx('nav__links-drawer', drawerBaseClassName, expandedSections.mobileNav ? drawerOpenClassName : drawerClosedClassName)}>
            {/* Mobile & Tablet content (including Explore) */}
            <div className="nav__drawer-content--mobile-tablet flex flex-col grow font-medium pb-8 pt-2 lg:hidden">
              <NavLinks
                onToggleExplore={onToggleExplore}
                exploreExpanded={expandedSections.explore}
                exploreSectionInline
                courses={courses}
                isScrolled={isScrolled}
                className="nav__links--mobile-tablet flex-col"
              />
              <CTAButtons
                primaryCtaText={primaryCtaText}
                primaryCtaUrl={primaryCtaUrl}
                className="nav__login--mobile justify-end gap-6 mt-20 flex sm:hidden"
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>
          <div className={clsx('nav__profile-drawer', drawerBaseClassName, expandedSections.profile ? drawerOpenClassName : drawerClosedClassName)}>
            <ProfileLinks isScrolled={isScrolled} />
          </div>
        </div>
      </ClickAwayListener>
    </nav>
  );
};
