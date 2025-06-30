import { useState, useEffect } from 'react';
import { addQueryParam, CTALinkOrButton } from '@bluedot/ui';

import { ProfileLinks } from './_ProfileLinks';
import { ROUTES } from '../../lib/routes';
import { ExpandedSectionsState } from './utils';

export const NavCta: React.FC<{
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
  const [joinUrl, setJoinUrl] = useState(ROUTES.join.url);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(addQueryParam(ROUTES.join.url, 'redirect_to', window.location.pathname));
    }
  }, []);

  const [loginUrl, setLoginUrl] = useState(ROUTES.login.url);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoginUrl(addQueryParam(ROUTES.login.url, 'redirect_to', window.location.pathname));
    }
  }, []);

  return (
    <div className="nav-cta flex flex-row items-center gap-2 sm:gap-6">
      {isLoggedIn ? (
        <ProfileLinks
          isScrolled={isScrolled}
          expandedSections={expandedSections}
          updateExpandedSections={updateExpandedSections}
        />
      ) : (
        <>
          <CTALinkOrButton
            className="nav-cta__secondary-cta hidden sm:block" // Hide on small screens
            variant="secondary"
            url={loginUrl}
          >
            Login
          </CTALinkOrButton>
          <CTALinkOrButton
            className="nav-cta__primary-cta"
            variant="primary"
            url={joinUrl}
          >
            Join for free
          </CTALinkOrButton>
        </>
      )}
    </div>
  );
};
