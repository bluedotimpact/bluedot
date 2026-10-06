import { A } from '@bluedot/ui';

export const NavLogo: React.FC<{ onColoredBackground: boolean }> = ({ onColoredBackground }) => {
  const logo = onColoredBackground
    ? '/images/logo/BlueDot_Impact_Logo_White.svg'
    : '/images/logo/BlueDot_Impact_Logo.svg';

  return (
    <A href="/" className="shrink-0 no-underline">
      <img
        className="h-5 bd-md:h-6"
        src={logo}
        alt="BlueDot Impact Logo"
      />
    </A>
  );
};
