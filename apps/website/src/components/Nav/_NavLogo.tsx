import clsx from "clsx";

import { A, H3 } from "../Text";
import { TRANSITION_DURATION_CLASS } from "./Nav";

export const NavLogo: React.FC<{ logo?: string; isScrolled: boolean }> = ({ logo, isScrolled }) => (
    <A href="/" className="logo shrink-0 w-[200px] no-underline">
      {logo ? (
        <img
          className={clsx(
            `logo__img h-6 mr-auto transition-all ${TRANSITION_DURATION_CLASS}`,
            isScrolled && 'brightness-0 invert',
          )}
          src={logo}
          alt="BlueDot Impact Logo"
        />
      ) : (
        <H3 className="logo__placeholder h-8 mr-auto">BlueDot Impact</H3>
      )}
    </A>
  );