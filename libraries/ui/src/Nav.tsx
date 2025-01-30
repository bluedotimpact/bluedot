import clsx from 'clsx';
import React, { useState } from 'react';
import { LinkOrButton, LinkOrButtonProps } from './legacy/LinkOrButton';

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

  return (
    <nav className={clsx(
      'nav fixed z-50 w-full bg-bluedot-canvas container-elevated',
      'transition-all duration-300 left-1/2 -translate-x-1/2',
      className,
    )}
    >
      <div className="flex items-center justify-center w-full max-w-max-width h-20 mx-auto px-8">
        <a href="/" className="shrink-0 w-[200px]">
          {logo ? <img className="nav_logo h-6 mr-auto" src={logo} alt="BlueDot Impact Logo" /> : <p className="nav_logo--placeholder h-8 mr-auto text-xl">BlueDot Impact</p>}
        </a>
        <div className="nav_links-container flex flex-grow justify-center items-center gap-[36px] relative">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:text-bluedot-normal"
          >
            Explore
            <svg
              className={clsx('w-4 h-4 transition-transform', isExpanded ? 'rotate-180' : '')}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {children}
        </div>
        <div className="shrink-0 w-[200px] flex justify-end">
          <NavButton.CTA href="/signup">Get started for Free</NavButton.CTA>
        </div>
      </div>

      <div className={clsx(
        'overflow-hidden transition-[max-height,opacity] duration-300',
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
      )}
      >
        <div className="flex justify-center pb-7">
          <div className="flex-grow flex justify-center items-center gap-[243px]">
            <div className="flex flex-col">
              <h2 className="font-bold text-xl mb-4">Our courses</h2>
              <div className="flex flex-col gap-[14px]">
                {courses?.map((course) => (
                  <a
                    key={course.href}
                    href={course.href}
                    className="hover:text-bluedot-normal flex items-center gap-2"
                    // TODO: 01/27 Update this to be in global styles when hover styles are confirmed
                  >
                    {course.isNew && (
                      <span className="text-bluedot-normal text-xl font-black">New!</span>
                    )}
                    {course.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
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
