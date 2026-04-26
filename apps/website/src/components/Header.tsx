'use client';

import type React from 'react';
import { Nav } from './Nav/Nav';

type HeaderProps = {
  announcementBanner?: React.ReactNode;
  pageRendersOwnNav?: boolean;
};

/**
 * Header component that handles the announcement banner and nav.
 *
 * When the active page renders its own Nav (e.g. an image-backed hero where
 * the Nav overlays the image), set `pageRendersOwnNav` so the global Nav is
 * skipped. Pages opt in via a `pageRendersOwnNav = true` static on the page
 * component, read by `_app.tsx` and forwarded here.
 */
export const Header: React.FC<HeaderProps> = ({ announcementBanner, pageRendersOwnNav }) => {
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
