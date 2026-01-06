import { A } from '@bluedot/ui';
import { TRANSITION_DURATION_CLASS } from './utils';

export const NavLogo: React.FC<{ onColoredBackground: boolean }> = ({ onColoredBackground }) => {
  const logo = onColoredBackground
    ? '/images/logo/BlueDot_Impact_Logo_White.svg'
    : '/images/logo/BlueDot_Impact_Logo.svg';

  return (
    <A href="/" className="logo shrink-0 w-[151px] min-[681px]:w-[200px] no-underline">
      <img
        className={`logo__img h-5 min-[681px]:h-6 mr-auto transition-all ${TRANSITION_DURATION_CLASS}`}
        src={logo}
        alt="BlueDot Impact Logo"
      />
    </A>
  );
};
