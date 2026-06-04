import { useState } from 'react';
import clsx from 'clsx';
import { FaCircleUser } from 'react-icons/fa6';
import { A, IconButton } from '@bluedot/ui';

import {
  type ExpandedSectionsState, DRAWER_CLASSES, DRAWER_Z_PROFILE, PROFILE_DROPDOWN_CLASS,
} from './utils';
import { ROUTES } from '../../lib/routes';
import { UserSearchModal } from '../admin/UserSearchModal';
import { IMPERSONATION_STORAGE_KEY, trpc } from '../../utils/trpc';
import { useClickOutside } from '../../lib/hooks/useClickOutside';
import { useBugReport } from '../../hooks/useBugReport';

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
  const { openBugReport } = useBugReport();

  const { data: impersonationAccess } = trpc.admin.canImpersonate.useQuery();
  const { data: facilitatorData } = trpc.myBluedot.hasFacilitatorRegistrations.useQuery();
  const { data: applicationsData } = trpc.myBluedot.hasFacilitatorRegistrations.useQuery({ includeWithdrawn: true });
  const profileRef = useClickOutside(
    () => updateExpandedSections({ profile: false }),
    expandedSections.profile,
    `.${PROFILE_DROPDOWN_CLASS}`,
  );

  const onToggleProfile = () => updateExpandedSections({
    courses: false,
    projects: false,
    programs: false,
    explore: false,
    mobileNav: false,
    profile: !expandedSections.profile,
  });

  const getNavLinkClasses = () => {
    // Profile dropdown links: always dark text on white background
    return clsx(
      'nav-link nav-link-animation w-fit no-underline text-size-sm font-[450] leading-[160%] align-middle',
      'text-bluedot-darker hover:text-bluedot-darker',
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
            href={ROUTES.myCourses.url}
            className={getNavLinkClasses()}
            onClick={onToggleProfile}
          >My Courses
          </A>
          {facilitatorData?.hasFacilitatorRegistrations && (
            <A
              href={ROUTES.facilitatedCourses.url}
              className={getNavLinkClasses()}
              onClick={onToggleProfile}
            >Facilitated Courses
            </A>
          )}
          {applicationsData?.hasFacilitatorRegistrations && (
            <A
              href={ROUTES.facilitatorApplications.url}
              className={getNavLinkClasses()}
              onClick={onToggleProfile}
            >Facilitator Applications
            </A>
          )}
          <A
            href={ROUTES.account.url}
            className={getNavLinkClasses()}
            onClick={onToggleProfile}
          >Account
          </A>
          <A
            href={typeof window !== 'undefined'
              ? `${ROUTES.logout.url}?redirect_to=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`
              : ROUTES.logout.url}
            className={getNavLinkClasses()}
            onClick={onToggleProfile}
          >Log out
          </A>
          <div className="border-t border-gray-200 my-2" />
          {impersonationAccess && impersonationAccess !== 'none' && (
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
          )}
          <button
            type="button"
            onClick={() => {
              openBugReport();
              updateExpandedSections({ profile: false });
            }}
            className={clsx('bluedot-a', getNavLinkClasses())}
          >
            Report a bug
          </button>
        </div>
      </div>
      {isImpersonateModalOpen && (
        <UserSearchModal
          isOpen={isImpersonateModalOpen}
          onClose={() => setIsImpersonateModalOpen(false)}
          title="Impersonate a user"
          scope="impersonate"
          onSelectUser={(userId) => {
            sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, userId);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
