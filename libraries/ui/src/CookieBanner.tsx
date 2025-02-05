import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { EXTERNAL_LINK_PROPS } from './utils';
import { CTALinkOrButton } from './CTALinkOrButton';

type CookieBannerProps = {
  // Optional
  className?: string
};

/**
 * Sets a localStorage item called 'cookies' to 'accepted' or
 * 'rejected' when dismissed via one of the buttons.
 */
export const CookieBanner: React.FC<CookieBannerProps> = ({ className }) => {
  const [showBanner, setShowBanner] = useState(false);

  const setCookieConsent = useCallback(
    (value: 'accepted' | 'rejected') => {
      localStorage.setItem('cookies', value);
      setShowBanner(false);
    },
    [],
  );

  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookies');
    if (cookieConsent !== 'accepted' && cookieConsent !== 'rejected') {
      setShowBanner(true);
    }
  }, []);

  if (!showBanner) return null;

  const rootClassName = clsx(
    'cookie-banner fixed bottom-6 right-0 mx-4 sm:mx-6 shadow-lg flex flex-col gap-5 p-6 rounded-lg bg-cream-normal w-fit max-w-[420px] border border-bluedot-normal',
    className,
  );

  return (
    <div className={rootClassName}>
      <div className="cookie-banner__text text-pretty">
        We use analytics cookies to improve our website and measure ad performance.{' '}
        <a className="underline" href="/privacy-policy" {...EXTERNAL_LINK_PROPS}>Cookie Policy</a>.
      </div>
      <div className="cookie-banner__buttons flex flex-wrap gap-4 justify-center">
        <CTALinkOrButton
          className="cookie-banner__button--reject"
          variant="primary"
          onClick={() => setCookieConsent('rejected')}
        >
          Reject all
        </CTALinkOrButton>
        <CTALinkOrButton
          className="cookie-banner__button--accept"
          variant="primary"
          onClick={() => setCookieConsent('accepted')}
        >
          Accept all
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export default CookieBanner;
