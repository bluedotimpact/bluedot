import { useState, useEffect } from 'react';
import { Button } from '@bluedot/ui';
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
    const baseClasses = 'px-3 py-[5px] rounded-md text-size-sm leading-relaxed items-center justify-center';

    if (type === 'primary') {
      return clsx(
        baseClasses,
        onColoredBackground
          ? 'bg-accent-on-dark hover:bg-accent-on-dark-hover text-bluedot-darker hover:text-bluedot-darker'
          : 'bg-accent hover:bg-accent-hover text-on-dark hover:text-on-dark',
      );
    }

    return clsx(
      baseClasses,
      onColoredBackground
        ? 'bg-white/15 border border-white/20 text-on-dark hover:text-on-dark hover:bg-white/20 backdrop-blur-sm'
        : 'border text-primary hover:text-primary hover:bg-tint',
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
          <Button
            className={clsx('nav-cta__secondary-cta flex', getButtonClasses('secondary'))}
            variant="secondary"
            url={loginUrl}
          >
            Sign in
          </Button>
          <Button
            className={clsx('nav-cta__primary-cta hidden bd-md:flex', getButtonClasses('primary'))}
            variant="primary"
            url={joinUrl}
          >
            Start for free
          </Button>
        </>
      )}
    </div>
  );
};
