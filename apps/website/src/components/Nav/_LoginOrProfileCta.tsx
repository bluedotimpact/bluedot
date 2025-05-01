import { useState, useEffect } from 'react';
import { addQueryParam, CTALinkOrButton } from '@bluedot/ui';

import { ProfileLinks } from './_ProfileLinks';
import { ROUTES } from '../../lib/routes';
import { ExpandedSectionsState } from './utils';

export const LoginOrProfileCta: React.FC<{
  // Required
  expandedSections: ExpandedSectionsState;
  isScrolled: boolean;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  // Optional
  isLoggedIn?: boolean;
}> = ({
  isLoggedIn,
  isScrolled,
  expandedSections,
  updateExpandedSections,
}) => {
  const [loginUrl, setLoginUrl] = useState(ROUTES.login.url);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoginUrl(addQueryParam(ROUTES.login.url, 'redirect_to', window.location.pathname));
    }
  }, []);

  return (
    isLoggedIn ? (
      <ProfileLinks
        isScrolled={isScrolled}
        expandedSections={expandedSections}
        updateExpandedSections={updateExpandedSections}
      />
    ) : (
      <CTALinkOrButton
        className="nav__primary-cta"
        variant="primary"
        url={loginUrl}
      >
        Login
      </CTALinkOrButton>
    )
  );
};
