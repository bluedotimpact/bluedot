import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import posthog from 'posthog-js';
import { CTALinkOrButton } from './CTALinkOrButton';

export type CookieBannerProps = {
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
      if (value === 'accepted') {
        posthog.set_config({ persistence: 'localStorage+cookie' });
      } else {
        posthog.set_config({ persistence: 'memory' });
      }
      setShowBanner(false);
    },
    [],
  );

  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookies');

    if (cookieConsent === 'accepted') {
      posthog.set_config({ persistence: 'localStorage+cookie' });
    } else if (cookieConsent === 'rejected') {
      posthog.set_config({ persistence: 'memory' });
    } else {
      setShowBanner(true);
    }
  }, []);

  if (!showBanner) return null;

  const rootClassName = clsx(
    'cookie-banner container-dialog fixed bottom-6 right-0 mx-4 sm:mx-6 flex flex-col gap-5 p-6 bg-cream-normal w-fit max-w-[420px] z-100',
    className,
  );

  return (
    <div className={rootClassName}>
      <p className="cookie-banner__text text-pretty bluedot-p">
        We use analytics cookies to improve our website and measure ad performance.{' '}
        <a href="https://bluedot.org/privacy-policy" className="bluedot-a">Cookie Policy</a>.
      </p>
      <div className="cookie-banner__buttons flex flex-wrap gap-space-between justify-center">
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
