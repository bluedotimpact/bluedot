import clsx from 'clsx';

import { A, H3 } from '../Text';
import { TRANSITION_DURATION_CLASS } from './utils';

export const NavLogo: React.FC<{ logo?: string; isScrolled: boolean; isHomepage?: boolean }> = ({ logo, isScrolled, isHomepage = false }) => (
  <A href="/" className="logo shrink-0 w-[151px] min-[681px]:w-[200px] no-underline">
    {logo ? (
      <img
        className={clsx(
          `logo__img h-5 min-[681px]:h-6 mr-auto transition-all ${TRANSITION_DURATION_CLASS}`,
          // Don't invert on homepage (already white), only invert on other pages when scrolled
          !isHomepage && isScrolled && 'brightness-0 invert',
        )}
        src={logo}
        alt="BlueDot Impact Logo"
      />
    ) : (
      <H3 className="logo__placeholder h-8 mr-auto">BlueDot Impact</H3>
    )}
  </A>
);
