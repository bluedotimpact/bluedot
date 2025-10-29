'use client';

import clsx from 'clsx';
import { IconButton, CTALinkOrButton } from '@bluedot/ui';
import { HamburgerIcon } from '@bluedot/ui/src/IconButton';
import { useRouter } from 'next/router';

import { NavLinks } from './_NavLinks';
import {
  DRAWER_CLASSES,
  ExpandedSectionsState,
} from './utils';
import { getLoginUrl } from '../../utils/getLoginUrl';

export const MobileNavLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  isScrolled: boolean;
  isLoggedIn: boolean;
  isHomepage?: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  isScrolled,
  isLoggedIn,
  isHomepage = false,
}) => {
  const router = useRouter();
  const joinUrl = getLoginUrl(router.asPath, true);
  const getPrimaryButtonClasses = () => {
    const isDark = isHomepage || isScrolled;
    const baseClasses = 'px-3 py-[5px] rounded-[5px] text-size-sm font-[450] leading-[160%] items-center justify-center';

    return clsx(
      baseClasses,
      isDark
        ? 'bg-white hover:bg-white/90 text-[#02034B]'
        : 'bg-[#2244BB] hover:bg-[#1a3599] text-white',
    );
  };

  const onToggleMobileNav = () => {
    updateExpandedSections({
      mobileNav: !expandedSections.mobileNav,
      explore: false,
      profile: false,
    });
  };

  return (
    <div className="mobile-nav-links lg:hidden">
      <IconButton
        open={expandedSections.mobileNav}
        Icon={<HamburgerIcon />}
        setOpen={onToggleMobileNav}
        className={clsx(
          'mobile-nav-links__btn',
          (isHomepage || isScrolled) && 'text-white [&_svg]:text-white',
        )}
      />
      <div className={clsx('mobile-nav-links__drawer', DRAWER_CLASSES(isScrolled, expandedSections.mobileNav))}>
        <div
          className="mobile-nav-links__drawer-content flex flex-col grow font-medium pb-8 pt-2 lg:hidden"
          onClick={(e) => {
            // Close mobile nav when any link is clicked
            if ((e.target as HTMLElement).tagName === 'A') {
              updateExpandedSections({
                about: false,
                explore: false,
                mobileNav: false,
                profile: false,
              });
            }
          }}
          onKeyDown={(e) => {
            // Also handle keyboard navigation
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'A') {
              updateExpandedSections({
                about: false,
                explore: false,
                mobileNav: false,
                profile: false,
              });
            }
          }}
          role="presentation"
        >
          <NavLinks
            className="mobile-nav-links__nav-links flex-col"
            expandedSections={expandedSections}
            updateExpandedSections={updateExpandedSections}
            isScrolled={isScrolled}
            isHomepage={isHomepage}
          />

          {/* CTA Buttons for mobile - prevent duplication with navbar buttons */}
          {!isLoggedIn && (
            <div className="mobile-nav-cta flex flex-col gap-4 pt-6 mt-6 border-t border-color-divider">
              {/* Start for free button: Show when screen < 680px */}
              <CTALinkOrButton
                className={clsx('mobile-nav-cta__join hidden max-[679px]:flex', getPrimaryButtonClasses())}
                variant="ghost"
                url={joinUrl}
              >
                Start for free
              </CTALinkOrButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
