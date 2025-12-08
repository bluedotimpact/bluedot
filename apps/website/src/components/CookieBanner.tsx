import React from 'react';
import clsx from 'clsx';
import { A, CTALinkOrButton } from '@bluedot/ui';
import { useConsentStore } from './analytics/consent';

export type CookieBannerProps = {
  // Optional
  className?: string
};

export const CookieBanner: React.FC<CookieBannerProps> = ({ className }) => {
  const isConsented = useConsentStore((s) => s.isConsented);
  if (isConsented !== undefined) return null;

  const rootClassName = clsx(
    'cookie-banner container-dialog fixed bottom-6 right-0 mx-4 sm:mx-6 flex flex-col gap-5 p-6 bg-cream-normal w-fit max-w-[420px] z-100',
    className,
  );

  return (
    <div className={rootClassName}>
      <p className="cookie-banner__text text-pretty bluedot-p">
        Analytics cookies help us improve our website and measure ad performance.{' '}
        <A href="https://bluedot.org/privacy-policy">Privacy Policy</A>.
      </p>
      <div className="cookie-banner__buttons flex flex-wrap gap-space-between justify-center">
        <CTALinkOrButton
          className="cookie-banner__button--accept"
          variant="primary"
          onClick={() => useConsentStore.getState().accept()}
        >
          Accept all
        </CTALinkOrButton>
        <CTALinkOrButton
          className="cookie-banner__button--reject"
          variant="primary"
          onClick={() => useConsentStore.getState().reject()}
        >
          Reject all
        </CTALinkOrButton>
      </div>
    </div>
  );
};
