import clsx from 'clsx';
import { IconButton, CTALinkOrButton } from '@bluedot/ui';
import { HamburgerIcon } from '@bluedot/ui/src/IconButton';
import { useRouter } from 'next/router';

import { NavLinks } from './_NavLinks';
import { DRAWER_CLASSES, ExpandedSectionsState } from './utils';
import { getLoginUrl } from '../../utils/getLoginUrl';

export const MobileNavLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  isScrolled: boolean;
  isLoggedIn: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  isScrolled,
  isLoggedIn,
}) => {
  const router = useRouter();
  const loginUrl = getLoginUrl(router.asPath);
  const joinUrl = getLoginUrl(router.asPath, true);

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
        className="mobile-nav-links__btn"
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
          />

          {/* CTA Buttons for mobile - prevent duplication with navbar buttons */}
          {!isLoggedIn && (
            <div className="mobile-nav-cta flex flex-wrap gap-3 pt-6 mt-6 border-t border-color-divider">
              {/* Login button: Show when screen < 640px (since navbar login is hidden below 640px) */}
              <CTALinkOrButton
                className={`mobile-nav-cta__login max-[639px]:flex hidden ${
                  isScrolled ? 'border-white text-white hover:bg-white/10' : ''
                }`}
                variant="secondary"
                url={loginUrl}
              >
                Login
              </CTALinkOrButton>
              {/* Join button: Show when screen < 640px (same as Login for unified breakpoint) */}
              <CTALinkOrButton
                className="mobile-nav-cta__join max-[639px]:flex hidden"
                variant="primary"
                url={joinUrl}
              >
                Join for free
              </CTALinkOrButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
