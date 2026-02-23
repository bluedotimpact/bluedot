import { useState } from 'react';
import clsx from 'clsx';
import { FaCircleUser } from 'react-icons/fa6';
import { A, IconButton } from '@bluedot/ui';

import {
  type ExpandedSectionsState, DRAWER_CLASSES, DRAWER_Z_PROFILE, PROFILE_DROPDOWN_CLASS,
} from './utils';
import { ROUTES } from '../../lib/routes';
import { UserSearchModal } from '../admin/UserSearchModal';
import { trpc } from '../../utils/trpc';
import { useClickOutside } from '../../lib/hooks/useClickOutside';

export const ProfileLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  onColoredBackground?: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  onColoredBackground = false,
}) => {
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const { data: isAdmin } = trpc.admin.isAdmin.useQuery();
  const profileRef = useClickOutside(
    () => updateExpandedSections({ profile: false }),
    expandedSections.profile,
    `.${PROFILE_DROPDOWN_CLASS}`,
  );

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
    <div ref={profileRef} className={PROFILE_DROPDOWN_CLASS}>
      <IconButton
        className={clsx(
          'profile-links__btn',
          onColoredBackground && 'text-white [&_svg]:text-white',
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
            href={typeof window !== 'undefined'
              ? `${ROUTES.logout.url}?redirect_to=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`
              : ROUTES.logout.url}
            className={getNavLinkClasses()}
            onClick={onToggleProfile}
          >Log out
          </A>
          {isAdmin && (
            <>
              <div className="border-t border-gray-200 my-2" />
              <button
                type="button"
                onClick={() => {
                  setIsImpersonateModalOpen(true);
                  updateExpandedSections({ profile: false });
                }}
                className={clsx('bluedot-a', getNavLinkClasses())}
              >
                Impersonate a user
              </button>
            </>
          )}
        </div>
      </div>
      {isImpersonateModalOpen && <UserSearchModal isOpen={isImpersonateModalOpen} onClose={() => setIsImpersonateModalOpen(false)} />}
    </div>
  );
};
