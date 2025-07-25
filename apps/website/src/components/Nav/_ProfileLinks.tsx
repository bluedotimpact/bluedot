import clsx from 'clsx';
import { FaCircleUser } from 'react-icons/fa6';
import { IconButton, BugReportModal } from '@bluedot/ui';
import { useState } from 'react';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <A
            href={ROUTES.settingsAccount.url}
            className={NAV_LINK_CLASSES(isScrolled)}
            onClick={onToggleProfile}
          >Account
          </A>
          <A
            href={ROUTES.settingsCourses.url}
            className={NAV_LINK_CLASSES(isScrolled)}
            onClick={onToggleProfile}
          >Courses
          </A>
          <A
            href={ROUTES.settingsCommunity.url}
            className={NAV_LINK_CLASSES(isScrolled)}
            onClick={onToggleProfile}
          >Community
          </A>
          <A
            href={ROUTES.contact.url}
            className={NAV_LINK_CLASSES(isScrolled)}
            onClick={onToggleProfile}
          >Help
          </A>
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              updateExpandedSections({ profile: false });
            }}
            className={clsx('bluedot-a', NAV_LINK_CLASSES(isScrolled))}
          >
            Submit Feedback
          </button>
          <A
            href={ROUTES.logout.url}
            className={NAV_LINK_CLASSES(isScrolled)}
            onClick={onToggleProfile}
          >Log out
          </A>
        </div>
      </div>
      <BugReportModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </div>
  );
};
