import clsx from 'clsx';
import { LinkOrButton, LinkOrButtonProps } from './legacy/LinkOrButton';

export type NavProps = React.PropsWithChildren<{
  className?: string,
  logo?: string
}>;

type NavButtonProps = LinkOrButtonProps;

export const Nav: React.FC<NavProps> = ({ children, className, logo }) => {
  return (
    <nav className={clsx('nav border rounded-full px-8 py-4 flex items-center gap-4 my-4 mx-8 shadow-md fixed top-0 left-0 right-0 z-50 bg-white', className)}>
      <a href="/">
        {logo ? <img className="nav_logo h-6 mr-auto" src={logo} alt="BlueDot Impact Logo" /> : <p className="nav_logo--placeholder h-8 mr-auto text-xl">BlueDot Impact</p>}
      </a>
      <div className="nav_links-container flex flex-grow justify-center items-center gap-4">
        {children}
      </div>
      <NavButton.CTA href="/signup">Get started for Free</NavButton.CTA>
    </nav>
  );
};

export const NavButton: React.FC<NavButtonProps> & {
  CTA: React.FC<NavButtonProps>
} = Object.assign(
  ({ className, ...rest }: NavButtonProps) => (
    <LinkOrButton className={clsx('nav_link-cta border border-neutral-500 rounded px-8 pb-4', className)} {...rest} />
  ),
  {
    CTA: ({ className, ...rest }: NavButtonProps) => (
      <LinkOrButton
        className={clsx(
          'bg-bluedot-lighter text-bluedot-normal font-medium',
          'border border-bluedot-lighter rounded-full px-6 py-2',
          'transition-all duration-200',
          'hover:bg-bluedot-normal hover:text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bluedot-normal',
          className,
        )}
        {...rest}
      />
    ),
  },
);
