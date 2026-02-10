'use client';

import { CTALinkOrButton, P, useCurrentTimeMs } from '@bluedot/ui';
import clsx from 'clsx';
import React from 'react';
import { useAnnouncementBannerStore } from '../stores/announcementBanner';

/**
 * Generates a unique key for an announcement banner based on its content.
 * Uses a djb2 hash algorithm to create a stable, short identifier.
 * Source: https://stackoverflow.com/questions/7666509/hash-function-for-string/7666577#7666577
 *
 * @param children - The React children (content) of the banner
 * @returns An 8 character base-36 encoded hash string that uniquely identifies the content
 */
export const getAnnouncementBannerKey = (children: React.ReactNode) => {
  const textFromNode = (node: React.ReactNode): string => {
    if (node == null || typeof node === 'boolean') {
      return '';
    }

    if (typeof node === 'string' || typeof node === 'number') {
      return String(node);
    }

    if (Array.isArray(node)) {
      return node.map(textFromNode).join(' ');
    }

    if (React.isValidElement(node)) {
      return textFromNode(node.props?.children);
    }

    return '';
  };

  const str = textFromNode(children).trim();
  let hash = 5381;

  for (let i = 0; i < str.length; i++) {
    hash = hash * 33 + str.charCodeAt(i);
  }

  // Convert to a positive number and then to base-36 string, taking first 8 characters
  return Math.abs(hash).toString(36).slice(0, 8);
};

export type AnnouncementBannerProps = React.PropsWithChildren<{
  className?: string;
  ctaText?: string;
  ctaUrl?: string;
  /** Hide the banner before this time. E.g. use this to schedule announcing a public product launch in the future */
  hideUntil?: Date;
  /** Hide the banner after this time. E.g. hide a banner announcing an event if the event has passed */
  hideAfter?: Date;
}>;

/** A banner with an announcement, and optionally a CTA. In most cases you'll want to use this in _app.tsx underneath Nav. */
export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  className,
  children,
  ctaText = 'Learn more',
  ctaUrl,
  hideUntil,
  hideAfter,
}) => {
  const bannerKey = getAnnouncementBannerKey(children);
  const dismissBanner = useAnnouncementBannerStore((state) => state.dismissBanner);
  const isDismissed = useAnnouncementBannerStore((s) => Boolean(s.dismissedBanners[bannerKey]));
  const currentTimeMs = useCurrentTimeMs();

  // If this banner has been dismissed (now or in the past) don't show it
  if (isDismissed) {
    return null;
  }

  if (hideUntil && currentTimeMs < hideUntil.getTime()) {
    return null;
  }

  if (hideAfter && currentTimeMs > hideAfter.getTime()) {
    return null;
  }

  return (
    <div
      className={clsx(
        'announcement-banner w-full py-4 bg-bluedot-lighter',
        className,
      )}
    >
      <div className="announcement-banner__container section-base flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        <P className="announcement-banner__content text-center sm:text-left">{children}</P>
        <div className="flex gap-2">
          {ctaUrl && (
            <CTALinkOrButton
              className="announcement-banner__cta"
              variant="black"
              url={ctaUrl}
            >
              {ctaText}
            </CTALinkOrButton>
          )}
          <CTALinkOrButton
            className="announcement-banner__close"
            variant="outline-black"
            size="small"
            aria-label="Close announcement"
            onClick={() => dismissBanner(bannerKey)}
          >
            <span aria-hidden="true">&times;</span>
          </CTALinkOrButton>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
