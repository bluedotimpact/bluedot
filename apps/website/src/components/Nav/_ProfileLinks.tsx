import { useState } from 'react';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { FaCircleUser, FaXmark } from 'react-icons/fa6';
import { A, IconButton } from '@bluedot/ui';

import {
  DRAWER_CLASSES, NAV_LINK_CLASS, type NavMenu, PROFILE_DRAWER_ID,
} from './utils';
import { ROUTES } from '../../lib/routes';
import { ModalLoadingFallback } from '../ModalLoadingFallback';
import { IMPERSONATION_STORAGE_KEY, trpc } from '../../utils/trpc';
import { safeSessionStorage } from '../../utils/safeStorage';
import { useDismissible } from '../../lib/hooks/useDismissible';
import { useFeedback } from '../../hooks/useFeedback';

const UserSearchModal = dynamic(() => import('../admin/UserSearchModal').then((m) => m.UserSearchModal), {
  loading: ModalLoadingFallback,
});

// Full-width rows like the mobile drawer below xl; a centred animated column under the desktop bar from xl
const PROFILE_LINK_CLASSES = clsx(NAV_LINK_CLASS, 'flex min-h-11 items-center text-primary hover:text-primary xl:w-fit xl:nav-link-animation');

type ProfileLinksProps = {
  menu: NavMenu;
  onColoredBackground?: boolean;
};

export const ProfileLinks = ({ menu, onColoredBackground = false }: ProfileLinksProps) => {
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const { openFeedback } = useFeedback();
  const { data: impersonationAccess } = trpc.admin.canImpersonate.useQuery();
  const { data: isAdmin } = trpc.admin.isUserAdmin.useQuery();
  const { data: facilitatorNavItems } = trpc.myBluedot.hasFacilitatorNavItems.useQuery();

  const isOpen = menu.openSection === 'profile';
  const { containerRef, triggerRef } = useDismissible(menu.closeSection, isOpen);

  return (
    <div ref={containerRef}>
      <IconButton
        ref={triggerRef}
        aria-label={isOpen ? 'Close profile menu' : 'Open profile menu'}
        aria-expanded={isOpen}
        aria-controls={PROFILE_DRAWER_ID}
        onClick={() => menu.toggleSection('profile')}
        data-on-dark={onColoredBackground || undefined}
      >
        {isOpen ? <FaXmark aria-hidden="true" className="size-5" /> : <FaCircleUser className="size-6 opacity-75" aria-hidden="true" />}
      </IconButton>
      <div id={PROFILE_DRAWER_ID} className={DRAWER_CLASSES(isOpen)}>
        <div className="flex flex-col xl:w-fit xl:mx-auto">
          <A href={ROUTES.myCourses.url} className={PROFILE_LINK_CLASSES} onClick={menu.closeSection}>
            My Courses
          </A>
          {facilitatorNavItems?.hasFacilitatedCourses && (
            <A href={ROUTES.facilitatedCourses.url} className={PROFILE_LINK_CLASSES} onClick={menu.closeSection}>
              Facilitated Courses
            </A>
          )}
          {facilitatorNavItems?.hasFacilitatorApplications && (
            <A href={ROUTES.facilitatorApplications.url} className={PROFILE_LINK_CLASSES} onClick={menu.closeSection}>
              Facilitator Applications
            </A>
          )}
          <A href={ROUTES.account.url} className={PROFILE_LINK_CLASSES} onClick={menu.closeSection}>
            Account
          </A>
          <A
            href={typeof window !== 'undefined'
              ? `${ROUTES.logout.url}?redirect_to=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`
              : ROUTES.logout.url}
            className={PROFILE_LINK_CLASSES}
            onClick={menu.closeSection}
          >
            Log out
          </A>
          <div className="border-t border-subtle my-2" />
          {impersonationAccess && impersonationAccess !== 'none' && (
            <button
              type="button"
              onClick={() => {
                setIsImpersonateModalOpen(true);
                menu.closeSection();
              }}
              className={PROFILE_LINK_CLASSES}
            >
              Impersonate a user
            </button>
          )}
          {isAdmin && (
            <A href={ROUTES.admin.url} className={PROFILE_LINK_CLASSES} onClick={menu.closeSection}>
              Admin tools
            </A>
          )}
          <button
            type="button"
            onClick={() => {
              openFeedback();
              menu.closeSection();
            }}
            className={PROFILE_LINK_CLASSES}
          >
            Submit feedback
          </button>
        </div>
      </div>
      {isImpersonateModalOpen && (
        <UserSearchModal
          isOpen={isImpersonateModalOpen}
          onClose={() => setIsImpersonateModalOpen(false)}
          title="Impersonate a user"
          scope="impersonate"
          onSelectUser={(user) => {
            safeSessionStorage.setItem(IMPERSONATION_STORAGE_KEY, user.id);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
