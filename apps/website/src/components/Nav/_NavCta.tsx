import { useState, useEffect } from 'react';
import { CTALinkOrButton } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { getLoginUrl } from '../../utils/getLoginUrl';

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
  const router = useRouter();
  const [loginUrl, setLoginUrl] = useState(ROUTES.login.url);
  const [joinUrl, setJoinUrl] = useState(ROUTES.join.url);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoginUrl(getLoginUrl(router.asPath));
      setJoinUrl(getLoginUrl(router.asPath, true));
    }
  }, [router.asPath]);

  return (
    <div className="nav-cta flex flex-row items-center gap-6">
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
            className="nav-cta__primary-cta mr-4 sm:mr-0"
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
