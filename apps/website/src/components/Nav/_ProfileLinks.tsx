import { useState } from 'react';
import clsx from 'clsx';
import { FaCircleUser } from 'react-icons/fa6';
import { IconButton, BugReportModal } from '@bluedot/ui';

import { DRAWER_CLASSES, ExpandedSectionsState } from './utils';
import { ROUTES } from '../../lib/routes';
import { A } from '../Text';

export const ProfileLinks: React.FC<{
  isScrolled: boolean;
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  isHomepage?: boolean;
}> = ({
  isScrolled,
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
    // Profile dropdown links: white text when dropdown has dark bg, dark text otherwise
    const isDarkDrawer = !isHomepage && isScrolled;
    const textColor = isDarkDrawer ? 'text-white hover:text-white' : 'text-[#02034B] hover:text-[#02034B]';

    return clsx(
      'nav-link nav-link-animation w-fit no-underline text-size-sm font-[450] leading-[160%] align-middle',
      textColor,
    );
  };

  return (
    <div className="profile-links">
      <IconButton
        className={clsx(
          'profile-links__btn',
          (isHomepage || isScrolled) && 'text-white [&_svg]:text-white',
        )}
        open={expandedSections.profile}
        Icon={<FaCircleUser className="size-6 opacity-75" />}
        setOpen={onToggleProfile}
      />
      <div className={clsx('profile-links__drawer', DRAWER_CLASSES(!isHomepage && isScrolled, expandedSections.profile))}>
        <div
          className={clsx(
            'profile-links__content-wrapper overflow-hidden transition-all duration-300 ease-in-out',
            expandedSections.profile ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="profile-links__links flex flex-col gap-4 items-end section-base">
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
      </div>
      <BugReportModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </div>
  );
};
