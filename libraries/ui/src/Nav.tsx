import clsx from 'clsx';
import { LinkOrButton, LinkOrButtonProps } from './LinkOrButton';

export type NavProps = React.PropsWithChildren<{
  className?: string,
  logo?: string
}>;

export const Nav: React.FC<NavProps> = ({ children, className, logo }) => {
  return (
    <nav className={clsx('border rounded-full px-8 py-4 flex items-center gap-4 my-4 mx-8 shadow-md fixed top-0 left-0 right-0 z-50 bg-white', className)}>
      {logo ? <img src={logo} alt="BlueDot Impact Logo" className="h-6 mr-auto" /> : <p className="h-8 mr-auto text-xl">BlueDot Impact</p>}
      {children}
      <NavButton.CTA href="/signup">Get started for Free</NavButton.CTA>
    </nav>
  );
};

export const NavButton: React.FC<LinkOrButtonProps> & {
  CTA: React.FC<LinkOrButtonProps>
} = Object.assign(
  ({ className, ...rest }) => (
    <LinkOrButton className={clsx('border border-neutral-500 rounded px-8 pb-4 text-bluedot-black transition-all duration-200 inline-block cursor-pointer data-[hovered]:border-bluedot-normal data-[hovered]:bg-bluedot-lighter data-[focus-visible]:border-bluedot-normal data-[focus-visible]:bg-bluedot-lighter data-[pressed]:border-bluedot-normal data-[pressed=true]:bg-bluedot-normal data-[pressed=true]:text-white outline-none [text-align:inherit]', className)} {...rest} />
  ),
  {
    CTA: ({ className, ...rest }) => (
      <LinkOrButton 
        className={clsx(
          'bg-bluedot-lighter text-bluedot-normal font-medium',
          'border border-bluedot-lighter rounded-full px-6 py-2',
          'transition-all duration-200',
          'hover:bg-bluedot-normal hover:text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bluedot-normal',
          className
        )} 
        {...rest} 
      />
    )
  }
);
