import { useState, useEffect } from 'react';
import { CTALinkOrButton } from '@bluedot/ui';
import { useRouter } from 'next/router';
import clsx from 'clsx';
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
  isHomepage?: boolean;
}> = ({
  isLoggedIn,
  isScrolled,
  expandedSections,
  updateExpandedSections,
  isHomepage = false,
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
  const getButtonClasses = (type: 'primary' | 'secondary') => {
    const isDark = isHomepage || isScrolled;
    const baseClasses = 'px-3 py-[5px] rounded-[5px] text-size-sm font-[450] leading-[160%] items-center justify-center';

    if (type === 'primary') {
      return clsx(
        baseClasses,
        isDark
          ? 'bg-white hover:bg-white/90 text-[#02034B]'
          : 'bg-[#2244BB] hover:bg-[#1a3599] text-white',
      );
    }

    return clsx(
      baseClasses,
      isDark
        ? 'bg-white/15 border border-white/20 text-white hover:text-white hover:bg-white/20 backdrop-blur-sm'
        : 'border border-color-divider text-color-text hover:text-color-text hover:bg-gray-50',
    );
  };

  return (
    <div className="nav-cta flex flex-row items-center gap-4">
      {isLoggedIn ? (
        <ProfileLinks
          isScrolled={isScrolled}
          expandedSections={expandedSections}
          updateExpandedSections={updateExpandedSections}
        />
      ) : (
        <>
          <CTALinkOrButton
            className={clsx('nav-cta__secondary-cta flex', getButtonClasses('secondary'))}
            variant="ghost"
            url={loginUrl}
          >
            Sign in
          </CTALinkOrButton>
          <CTALinkOrButton
            className={clsx('nav-cta__primary-cta hidden min-[680px]:flex', getButtonClasses('primary'))}
            variant="ghost"
            url={joinUrl}
          >
            Start for free
          </CTALinkOrButton>
        </>
      )}
    </div>
  );
};
