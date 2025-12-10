'use client';

import React from 'react';
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
  const pageRendersOwnNav = router.pathname === '/' || router.pathname === '/courses';

  if (pageRendersOwnNav) {
    return announcementBanner ?? null;
  }

  return (
    <>
      <Nav />
      {announcementBanner}
    </>
  );
};

export default Header;
