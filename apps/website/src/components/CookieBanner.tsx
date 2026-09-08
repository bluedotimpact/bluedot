import type React from 'react';
import clsx from 'clsx';
import { A, CTALinkOrButton, P } from '@bluedot/ui';
import { useConsentStore } from './analytics/consent';

export type CookieBannerProps = {
  // Optional
  className?: string;
};

export const CookieBanner: React.FC<CookieBannerProps> = ({ className }) => {
  const isConsented = useConsentStore((s) => s.isConsented);
  if (isConsented !== undefined) {
    return null;
  }

  const rootClassName = clsx(
    'container-dialog fixed bottom-6 right-0 mx-4 sm:mx-6 flex flex-col gap-5 p-6 bg-cream-normal w-fit max-w-[420px] z-100',
    className,
  );

  return (
    <div className={rootClassName}>
      <P className="text-pretty">
        Analytics cookies help us improve our website and measure ad performance.{' '}
        <A href="https://bluedot.org/privacy-policy">Privacy Policy</A>.
      </P>
      <div className="flex flex-wrap gap-space-between justify-center">
        <CTALinkOrButton
          variant="primary"
          onClick={() => useConsentStore.getState().accept()}
        >
          Accept all
        </CTALinkOrButton>
        <CTALinkOrButton
          variant="primary"
          onClick={() => useConsentStore.getState().reject()}
        >
          Reject all
        </CTALinkOrButton>
      </div>
    </div>
  );
};
