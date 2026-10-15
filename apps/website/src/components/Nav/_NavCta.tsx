import { useEffect, useState } from 'react';
import { Button } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { getLoginUrl } from '../../utils/getLoginUrl';
import { ROUTES } from '../../lib/routes';

import { ProfileLinks } from './_ProfileLinks';
import { type NavMenu } from './utils';

type NavCtaProps = {
  menu: NavMenu;
  isLoggedIn?: boolean;
  onColoredBackground?: boolean;
};

export const NavCta = ({ menu, isLoggedIn, onColoredBackground = false }: NavCtaProps) => {
  const router = useRouter();
  // Static pages render asPath without the query string on the server, so set the redirect_to after hydration
  const [loginUrl, setLoginUrl] = useState(ROUTES.login.url);
  const [joinUrl, setJoinUrl] = useState(ROUTES.join.url);
  useEffect(() => {
    setLoginUrl(getLoginUrl(router.asPath));
    setJoinUrl(getLoginUrl(router.asPath, true));
  }, [router.asPath]);

  if (isLoggedIn) {
    return <ProfileLinks menu={menu} onColoredBackground={onColoredBackground} />;
  }

  // data-on-dark stays on this wrapper, not the <nav>: the drawers are DOM-nested inside the bar and sit on canvas
  return (
    <div className="flex flex-row items-center gap-4" data-on-dark={onColoredBackground || undefined}>
      <Button variant="secondary" url={loginUrl}>
        Sign in
      </Button>
      <Button className="hidden bd-md:flex" url={joinUrl}>
        Start for free
      </Button>
    </div>
  );
};
