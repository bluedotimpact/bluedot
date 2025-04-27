import React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from '@bluedot/ui/src/CTALinkOrButton';
import { P } from './Text';

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
  if (hideUntil && Date.now() < hideUntil.getTime()) {
    return null;
  }

  if (hideAfter && Date.now() > hideAfter.getTime()) {
    return null;
  }

  return (
    <div className={clsx(
      'announcement-banner w-full py-4 bg-bluedot-lighter',
      className,
    )}
    >
      <div className="announcement-banner__container section-base flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        <P className="announcement-banner__content text-center sm:text-left">{children}</P>
        {ctaUrl && (
          <CTALinkOrButton
            className="announcement-banner__cta"
            variant="secondary"
            url={ctaUrl}
          >
            {ctaText}
          </CTALinkOrButton>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBanner;
