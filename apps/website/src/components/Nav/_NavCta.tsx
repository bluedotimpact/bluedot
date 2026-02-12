import { useState, useEffect } from 'react';
import { CTALinkOrButton } from '@bluedot/ui';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { getLoginUrl } from '../../utils/getLoginUrl';

import { ProfileLinks } from './_ProfileLinks';
import { ROUTES } from '../../lib/routes';
import { type ExpandedSectionsState } from './utils';

export const NavCta: React.FC<{
  // Required
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  // Optional
  isLoggedIn?: boolean;
  onColoredBackground?: boolean;
}> = ({
  isLoggedIn,
  expandedSections,
  updateExpandedSections,
  onColoredBackground = false,
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
    const baseClasses = 'px-3 py-[5px] rounded-[5px] text-size-sm font-[450] leading-[160%] items-center justify-center';

    if (type === 'primary') {
      return clsx(
        baseClasses,
        onColoredBackground
          ? 'bg-white hover:bg-white/90 text-[#02034B] hover:text-[#02034B]'
          : 'bg-bluedot-normal hover:bg-[#1a3599] text-white hover:text-white',
      );
    }

    return clsx(
      baseClasses,
      onColoredBackground
        ? 'bg-white/15 border border-white/20 text-white hover:text-white hover:bg-white/20 backdrop-blur-sm'
        : 'border border-color-divider text-color-text hover:text-color-text hover:bg-gray-50',
    );
  };

  return (
    <div className="nav-cta flex flex-row items-center gap-4">
      {isLoggedIn ? (
        <ProfileLinks
          expandedSections={expandedSections}
          updateExpandedSections={updateExpandedSections}
          onColoredBackground={onColoredBackground}
        />
      ) : (
        <>
          <CTALinkOrButton
            className={clsx('nav-cta__secondary-cta flex', getButtonClasses('secondary'))}
            variant="secondary"
            url={loginUrl}
          >
            Sign in
          </CTALinkOrButton>
          <CTALinkOrButton
            className={clsx('nav-cta__primary-cta hidden min-[680px]:flex', getButtonClasses('primary'))}
            variant="primary"
            url={joinUrl}
          >
            Start for free
          </CTALinkOrButton>
        </>
      )}
    </div>
  );
};
