'use client';

import type React from 'react';
import { useRouter } from 'next/router';
import { Nav } from './Nav/Nav';

type HeaderProps = {
  announcementBanner?: React.ReactNode;
};

/**
 * Header component that handles the announcement banner and nav.
 */
export const Header: React.FC<HeaderProps> = ({ announcementBanner }) => {
  const router = useRouter();
  // Pages that render their own Nav: homepage, /courses index, and course lander pages
  const isCourseLander = router.pathname === '/courses/[courseSlug]';
  const isProgramsPage = router.pathname === '/programs' || router.pathname.startsWith('/programs/');
  const pageRendersOwnNav = router.pathname === '/'
    || router.pathname === '/courses'
    || router.pathname === '/about'
    || router.pathname === '/events'
    || router.pathname === '/join-us'
    || router.pathname === '/grants'
    || isCourseLander
    || isProgramsPage;

  if (pageRendersOwnNav) {
    return announcementBanner ?? null;
  }

  return (
    <>
      {announcementBanner}
      <Nav />
    </>
  );
};

export default Header;
