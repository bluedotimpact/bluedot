import { Button } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { getLoginUrl } from '../../utils/getLoginUrl';

import { ProfileLinks } from './_ProfileLinks';
import { type NavMenu } from './utils';

type NavCtaProps = {
  menu: NavMenu;
  isLoggedIn?: boolean;
  onColoredBackground?: boolean;
};

export const NavCta = ({ menu, isLoggedIn, onColoredBackground = false }: NavCtaProps) => {
  const router = useRouter();

  if (isLoggedIn) {
    return <ProfileLinks menu={menu} onColoredBackground={onColoredBackground} />;
  }

  // data-on-dark stays on this wrapper, not the <nav>: the drawers are DOM-nested inside the bar and sit on canvas
  return (
    <div className="flex flex-row items-center gap-4" data-on-dark={onColoredBackground || undefined}>
      <Button variant="secondary" url={getLoginUrl(router.asPath)}>
        Sign in
      </Button>
      <Button className="hidden bd-md:flex" url={getLoginUrl(router.asPath, true)}>
        Start for free
      </Button>
    </div>
  );
};
