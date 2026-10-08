import { useEffect, useState } from 'react';
import { Button, IconButton } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { FaBars, FaXmark } from 'react-icons/fa6';

import { NavLinks } from './_NavLinks';
import { DRAWER_CLASSES, MOBILE_NAV_DRAWER_ID, type NavMenu } from './utils';
import { getLoginUrl } from '../../utils/getLoginUrl';
import { ROUTES } from '../../lib/routes';
import { useDismissible } from '../../lib/hooks/useDismissible';

type MobileNavLinksProps = {
  menu: NavMenu;
  isLoggedIn: boolean;
  onColoredBackground?: boolean;
};

export const MobileNavLinks = ({ menu, isLoggedIn, onColoredBackground = false }: MobileNavLinksProps) => {
  const router = useRouter();
  const [joinUrl, setJoinUrl] = useState(ROUTES.join.url);
  useEffect(() => {
    setJoinUrl(getLoginUrl(router.asPath, true));
  }, [router.asPath]);
  const { containerRef, triggerRef } = useDismissible(menu.closeAll, menu.mobileNavOpen);

  return (
    <div ref={containerRef} className="xl:hidden">
      <IconButton
        ref={triggerRef}
        aria-label={menu.mobileNavOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menu.mobileNavOpen}
        aria-controls={MOBILE_NAV_DRAWER_ID}
        onClick={menu.toggleMobileNav}
        data-on-dark={onColoredBackground || undefined}
      >
        {menu.mobileNavOpen ? <FaXmark aria-hidden="true" className="size-5" /> : <FaBars aria-hidden="true" className="size-4" />}
      </IconButton>
      <div id={MOBILE_NAV_DRAWER_ID} className={DRAWER_CLASSES(menu.mobileNavOpen)}>
        <div className="flex flex-col grow font-medium xl:hidden">
          <NavLinks menu={menu} inMobileDrawer />

          {/* The bar shows this CTA from bd-md up; the drawer carries it below that */}
          {!isLoggedIn && (
            <div className="pt-6 mt-6 border-t border-subtle bd-md:hidden">
              <Button className="w-full" url={joinUrl}>
                Start for free
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
