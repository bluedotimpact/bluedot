'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { Nav } from './Nav/Nav';

type HeaderProps = {
  announcementBanner?: React.ReactNode;
};

/**
 * Header component that wraps the announcement banner and nav together.
 * On homepage/courses pages, positions both absolutely over the hero.
 * On other pages, renders them in normal document flow.
 */
export const Header: React.FC<HeaderProps> = ({ announcementBanner }) => {
  const router = useRouter();
  const isAbsoluteNav = router.pathname === '/' || router.pathname === '/courses';

  if (isAbsoluteNav) {
    return (
      <header className="absolute top-0 inset-x-0 z-50 flex flex-col">
        {announcementBanner}
        <Nav />
      </header>
    );
  }

  return (
    <>
      <Nav />
      {announcementBanner}
    </>
  );
};

export default Header;
