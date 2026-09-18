'use client';

import {
  CTALinkOrButton, Eyebrow, P, useCurrentTimeMs,
} from '@bluedot/ui';
import clsx from 'clsx';
import React, { useId } from 'react';
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
  label?: string;
  ctaText?: string;
  ctaUrl?: string;
  /** Hide the banner before this time. E.g. use this to schedule announcing a public product launch in the future */
  hideUntil?: Date;
  /** Hide the banner after this time. E.g. hide a banner announcing an event if the event has passed */
  hideAfter?: Date;
  /**
   * Whether to show the Dismiss button. Defaults to true.
   *
   * Dismissal is keyed by a hash of the message text and persisted in localStorage, so a dismissed banner stays hidden across visits.
   */
  dismissible?: boolean;
}>;

/**
 * A banner with an announcement, and optionally a CTA. In most cases you'll want to use this in _app.tsx underneath Nav.
 */
export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  className,
  children,
  label,
  ctaText = 'Learn more',
  ctaUrl,
  hideUntil,
  hideAfter,
  dismissible = true,
}) => {
  const contentId = useId();
  const bannerKey = getAnnouncementBannerKey(children);
  const dismissBanner = useAnnouncementBannerStore((state) => state.dismissBanner);
  const isDismissed = useAnnouncementBannerStore((s) => Boolean(s.dismissedBanners[bannerKey]));
  const currentTimeMs = useCurrentTimeMs();

  // If this banner has been dismissed (now or in the past) don't show it
  if (dismissible && isDismissed) {
    return null;
  }

  if (hideUntil && currentTimeMs < hideUntil.getTime()) {
    return null;
  }

  if (hideAfter && currentTimeMs > hideAfter.getTime()) {
    return null;
  }

  return (
    <section
      aria-label="Announcement"
      className={clsx(
        'w-full border-b border-subtle bg-accent-subtle text-primary',
        className,
      )}
    >
      <div className="section-base">
        <div className="flex flex-col gap-3 py-3 sm:py-3.5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1">
            <div id={contentId} className="flex flex-col gap-1.5">
              {label && <Eyebrow>{label}</Eyebrow>}
              <P className="max-w-4xl text-pretty text-size-xs leading-6 text-primary sm:text-size-sm">
                {children}
              </P>
            </div>
          </div>

          {(!!ctaUrl || dismissible) && (
            <div className="flex flex-wrap items-center gap-2">
              {ctaUrl && (
                <CTALinkOrButton
                  size="small"
                  variant="primary"
                  url={ctaUrl}
                  withChevron
                >
                  {ctaText}
                </CTALinkOrButton>
              )}
              {dismissible && (
                <CTALinkOrButton
                  variant="outline-black"
                  size="small"
                  aria-label="Dismiss announcement"
                  aria-describedby={contentId}
                  onClick={() => dismissBanner(bannerKey)}
                >
                  Dismiss
                </CTALinkOrButton>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
