import clsx from 'clsx';
import { LinkOrButton, LinkOrButtonProps } from './LinkOrButton';

export type CardProps = React.PropsWithChildren<{
  className?: string
}>;

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={clsx('border border-neutral-500 rounded px-8 pb-4', className)}>
      {children}
    </div>
  );
};

export const CardButton: React.FC<LinkOrButtonProps> = ({ className, ...rest }) => {
  return (
    <LinkOrButton className={clsx('border border-neutral-500 rounded px-8 pb-4 text-bluedot-black transition-all duration-200 inline-block cursor-pointer data-[hovered]:border-bluedot-normal data-[hovered]:bg-bluedot-lighter data-[focus-visible]:border-bluedot-normal data-[focus-visible]:bg-bluedot-lighter data-[pressed]:border-bluedot-normal data-[pressed=true]:bg-bluedot-normal data-[pressed=true]:text-white outline-none [text-align:inherit]', className)} {...rest} />
  );
};
