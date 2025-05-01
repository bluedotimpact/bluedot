import clsx from 'clsx';
import { IconButton } from '@bluedot/ui';
import { HamburgerIcon } from '@bluedot/ui/src/IconButton';

import { NavLinks } from './_NavLinks';
import { DRAWER_CLASSES, ExpandedSectionsState } from './utils';
import { SecondaryNavCta } from './_SecondaryNavCta';

export const MobileNavLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  courses: { title: string; url: string; isNew?: boolean }[];
  isScrolled: boolean;
  isLoggedIn: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  courses,
  isScrolled,
}) => {
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
        <div className="mobile-nav-links__drawer-content flex flex-col grow font-medium pb-8 pt-2 lg:hidden">
          <NavLinks
            className="mobile-nav-links__nav-links flex-col"
            expandedSections={expandedSections}
            updateExpandedSections={updateExpandedSections}
            courses={courses}
            isScrolled={isScrolled}
          />
          <div className="mobile-nav-links__secondary-cta flex justify-end mt-20">
            <SecondaryNavCta />
          </div>
        </div>
      </div>
    </div>
  );
};
