import { useState } from 'react';
import clsx from 'clsx';
import { FaCircleUser } from 'react-icons/fa6';
import { IconButton, BugReportModal } from '@bluedot/ui';

import { ExpandedSectionsState, DRAWER_CLASSES, DRAWER_Z_PROFILE } from './utils';
import { ROUTES } from '../../lib/routes';
import { A } from '../Text';

export const ProfileLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  isHomepage?: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  isHomepage = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onToggleProfile = () => updateExpandedSections({
    about: false,
    explore: false,
    mobileNav: false,
    profile: !expandedSections.profile,
  });

  const getNavLinkClasses = () => {
    // Profile dropdown links: always dark text on white background
    return clsx(
      'nav-link nav-link-animation w-fit no-underline text-size-sm font-[450] leading-[160%] align-middle',
      'text-[#02034B] hover:text-[#02034B]',
    );
  };

  return (
    <div className="profile-links">
      <IconButton
        className={clsx(
          'profile-links__btn',
          isHomepage && 'text-white [&_svg]:text-white',
        )}
        open={expandedSections.profile}
        Icon={<FaCircleUser className="size-6 opacity-75" />}
        setOpen={onToggleProfile}
      />
      <div
        className={clsx(
          'profile-links__drawer',
          DRAWER_CLASSES(expandedSections.profile, DRAWER_Z_PROFILE),
        )}
      >
        <div className="profile-links__links flex flex-col gap-4 w-fit overflow-hidden mx-auto">
          <A
            href={ROUTES.settingsAccount.url}
            className={getNavLinkClasses()}
            onClick={onToggleProfile}
          >Account
          </A>
          <A
            href={ROUTES.settingsCourses.url}
            className={getNavLinkClasses()}
            onClick={onToggleProfile}
          >Courses
          </A>
          <A
            href={ROUTES.contact.url}
            className={getNavLinkClasses()}
            onClick={onToggleProfile}
          >Help
          </A>
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              updateExpandedSections({ profile: false });
            }}
            className={clsx('bluedot-a', getNavLinkClasses())}
          >
            Submit Feedback
          </button>
          <A
            href={ROUTES.logout.url}
            className={getNavLinkClasses()}
            onClick={onToggleProfile}
          >Log out
          </A>
        </div>
      </div>
      <BugReportModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </div>
  );
};
