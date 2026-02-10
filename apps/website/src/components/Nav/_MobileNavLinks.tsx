'use client';

import clsx from 'clsx';
import { IconButton, CTALinkOrButton } from '@bluedot/ui';
import { HamburgerIcon } from '@bluedot/ui/src/IconButton';
import { useRouter } from 'next/router';

import { NavLinks } from './_NavLinks';
import {
  DRAWER_CLASSES,
  type ExpandedSectionsState,
  MOBILE_NAV_CLASS,
} from './utils';
import { getLoginUrl } from '../../utils/getLoginUrl';
import { useClickOutside } from '../../lib/hooks/useClickOutside';

export const MobileNavLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  isLoggedIn: boolean;
  onColoredBackground?: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  isLoggedIn,
  onColoredBackground = false,
}) => {
  const router = useRouter();
  const joinUrl = getLoginUrl(router.asPath, true);
  const mobileNavRef = useClickOutside(
    () => updateExpandedSections({ mobileNav: false }),
    expandedSections.mobileNav,
    `.${MOBILE_NAV_CLASS}`,
  );

  const getPrimaryButtonClasses = () => {
    const baseClasses = 'px-3 py-[5px] rounded-[5px] text-size-sm font-[450] leading-[160%] items-center justify-center';

    return clsx(
      baseClasses,
      'bg-bluedot-normal hover:bg-[#1a3599] text-white hover:text-white',
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
    <div ref={mobileNavRef} className={`${MOBILE_NAV_CLASS} lg:hidden`}>
      <IconButton
        open={expandedSections.mobileNav}
        Icon={<HamburgerIcon />}
        setOpen={onToggleMobileNav}
        className={clsx(
          'mobile-nav-links__btn',
          onColoredBackground && 'text-white [&_svg]:text-white',
        )}
      />
      <div className={clsx('mobile-nav-links__drawer', DRAWER_CLASSES(expandedSections.mobileNav))}>
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
            onColoredBackground={onColoredBackground}
          />

          {/* CTA Buttons for mobile - prevent duplication with navbar buttons */}
          {!isLoggedIn && (
            <div className="mobile-nav-cta flex flex-col gap-4 pt-6 mt-6 border-t border-color-divider">
              {/* Start for free button: Show when screen < 680px */}
              <CTALinkOrButton
                className={clsx('mobile-nav-cta__join hidden max-[679px]:flex', getPrimaryButtonClasses())}
                variant="primary"
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
