import clsx from 'clsx';
import { FaCircleUser } from 'react-icons/fa6';
import { IconButton } from '@bluedot/ui';

import { DRAWER_CLASSES, ExpandedSectionsState, NAV_LINK_CLASSES } from './utils';
import { ROUTES } from '../../lib/routes';
import { A } from '../Text';

export const ProfileLinks: React.FC<{
  isScrolled: boolean;
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
}> = ({
  isScrolled,
  expandedSections,
  updateExpandedSections,
}) => {
  const onToggleProfile = () => updateExpandedSections({
    about: false,
    explore: false,
    mobileNav: false,
    profile: !expandedSections.profile,
  });

  return (
    <div className="profile-links">
      <IconButton
        className="profile-links__btn"
        open={expandedSections.profile}
        Icon={<FaCircleUser className="size-6 opacity-75" />}
        setOpen={onToggleProfile}
      />
      <div className={clsx('profile-links__drawer', DRAWER_CLASSES(isScrolled, expandedSections.profile))}>
        <div className={clsx('profile-links__links flex flex-col gap-4 items-end section-base', !expandedSections.profile && 'hidden')}>
          <A href={ROUTES.profile.url} className={NAV_LINK_CLASSES(isScrolled)}>Profile</A>
          <A href={ROUTES.contact.url} className={NAV_LINK_CLASSES(isScrolled)}>Help</A>
          <A href={ROUTES.logout.url} className={NAV_LINK_CLASSES(isScrolled)}>Log out</A>
        </div>
      </div>
    </div>
  );
};
