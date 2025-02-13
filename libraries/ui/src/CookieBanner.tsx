import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import posthog from 'posthog-js';
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
      console.log(`Setting cookie consent to: ${value}`);
      localStorage.setItem('cookies', value);
      if (value === 'accepted') {
        console.log('Opting in to PostHog via button click...');
        posthog.opt_in_capturing();
      } else {
        console.log('Opting out of PostHog via button click...');
        posthog.opt_out_capturing();
      }
      setShowBanner(false);
    },
    [],
  );

  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookies');
    console.log('Initial cookie consent value:', cookieConsent);

    if (cookieConsent === 'accepted') {
      console.log('Opting in to PostHog on initial load...');
      posthog.opt_in_capturing();
    } else if (cookieConsent === 'rejected') {
      console.log('Opting out of PostHog on initial load...');
      posthog.opt_out_capturing();
    } else {
      console.log('No cookie consent found, showing banner...');
      setShowBanner(true);
    }
  }, []);

  if (!showBanner) return null;

  const rootClassName = clsx(
    'cookie-banner container-dialog fixed bottom-6 right-0 mx-4 sm:mx-6 flex flex-col gap-5 p-6 bg-cream-normal w-fit max-w-[420px]',
    className,
  );

  return (
    <div className={rootClassName}>
      <p className="cookie-banner__text text-pretty">
        We use analytics cookies to improve our website and measure ad performance.{' '}
        <a href="/privacy-policy">Cookie Policy</a>.
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
