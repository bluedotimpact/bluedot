import { GoogleTagManager as NextGoogleTagManager } from '@next/third-parties/google';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useConsentStore } from './consent';

export const GoogleTagManager: React.FC = () => {
  if (!process.env.NEXT_PUBLIC_GTM_ID) {
    return null;
  }

  return <ActiveGoogleTagManager />;
};

const ActiveGoogleTagManager: React.FC = () => {
  return (
    <>
      <NextGoogleTagManager gtmId={`${process.env.NEXT_PUBLIC_GTM_ID}`} />
      <GoogleTagManagerConsentListener />
    </>
  );
};

const GoogleTagManagerConsentListener: React.FC = () => {
  const consentValue = useConsentStore((s) => s.isConsented) ? 'granted' : 'denied';
  const hasInited = useRef(false);

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(['consent', hasInited.current ? 'update' : 'default', {
      ad_user_data: consentValue,
      ad_personalization: consentValue,
      ad_storage: consentValue,
      analytics_storage: consentValue,
      wait_for_update: 500,
    }]);
    hasInited.current = true;
  }, [consentValue]);

  return null;
};
