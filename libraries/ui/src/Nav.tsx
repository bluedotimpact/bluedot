import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { LinkOrButton, LinkOrButtonProps } from './legacy/LinkOrButton';
import { CTALinkOrButton } from './CTALinkOrButton';
import { EXTERNAL_LINK_PROPS } from './utils';

export type NavProps = React.PropsWithChildren<{
  className?: string,
  logo?: string,
  courses: Array<{
    title: string;
    href: string;
    isNew?: boolean;
  }>;
}>;

type NavButtonProps = LinkOrButtonProps;

export const Nav: React.FC<NavProps> = ({
  children, className, logo, courses,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={clsx(
      'nav fixed z-50 w-full container-elevated transition-all duration-300 left-1/2 -translate-x-1/2',
      isScrolled ? 'bg-bluedot-darker' : 'bg-color-canvas',
      isScrolled && '[&_a]:text-white [&_a]:hover:text-bluedot-lighter',
      className,
    )}
    >
      <div className="nav__container flex items-center justify-center w-full max-w-max-width h-20 mx-auto px-8">
        <a href="/" className="nav__logo-link shrink-0 w-[200px]">
          {logo && (
            <img
              className={clsx(
                'nav__logo h-6 mr-auto transition-all duration-300',
                isScrolled && 'brightness-0 invert',
              )}
              src={logo}
              alt="BlueDot Impact Logo"
            />
          )}
        </a>
        <div className={clsx(
          'nav__links-container flex flex-grow justify-center items-center gap-[36px] relative',
          isScrolled && 'text-white',
        )}
        >
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="nav__dropdown-button flex items-center gap-2 hover:text-bluedot-normal"
          >
            Explore
            <svg
              className={clsx('size-4 transition-transform', isExpanded ? 'rotate-180' : '')}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {children}
        </div>
        <div className="nav__cta-container shrink-0 flex justify-end items-center gap-[36px]">
          {/* <a className="nav__secondary-cta" href="https://course.aisafetyfundamentals.com/alignment?show=login" {...EXTERNAL_LINK_PROPS}>Login</a> */}
          {/* <CTALinkOrButton className="nav__primary-cta" url="https://aisafetyfundamentals.com/" {...EXTERNAL_LINK_PROPS}>Get started for free</CTALinkOrButton> */}
          <CTALinkOrButton className="nav__primary-cta" url="https://donate.stripe.com/5kA3fpgjpdJv6o89AA" {...EXTERNAL_LINK_PROPS}>Support us</CTALinkOrButton>
        </div>
      </div>

      <div className={clsx(
        'nav__dropdown overflow-hidden transition-[max-height,opacity] duration-300 flex justify-center items-center pb-7',
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
      )}
      >
        <div className="nav__dropdown-content flex flex-col gap-[14px] w-max">
          <h2 className="nav__dropdown-title font-bold text-xl">Our courses</h2>
          {courses?.map((course) => (
            <a
              key={course.href}
              href={course.href}
              className="nav__dropdown-link"
            >
              {course.isNew && (
                <span className="nav__new-badge text-bluedot-normal text-xl font-black pr-2">New!</span>
              )}
              {course.title}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export const NavButton: React.FC<NavButtonProps> & {
  CTA: React.FC<NavButtonProps>
} = Object.assign(
  ({ className, ...rest }: NavButtonProps) => (
    <LinkOrButton className={clsx('nav_link-cta border border-neutral-500 rounded px-8 pb-4', className)} {...rest} />
  ),
  {
    CTA: ({ className, ...rest }: NavButtonProps) => (
      <LinkOrButton
        className={clsx(
          'bg-bluedot-lighter text-bluedot-normal font-medium',
          'border border-bluedot-lighter rounded-full px-6 py-2',
          'transition-all duration-200',
          'hover:bg-bluedot-normal hover:text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bluedot-normal',
          className,
        )}
        {...rest}
      />
    ),
  },
);
