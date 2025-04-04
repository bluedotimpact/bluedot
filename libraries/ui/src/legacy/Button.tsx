import clsx from 'clsx';
import { LinkOrButton, LinkOrButtonProps } from './LinkOrButton';

export type ButtonProps = LinkOrButtonProps;

export const Button = ({
  children, className, onPress, disabled, href, target,
}: ButtonProps) => {
  const classes = clsx('text-base font-normal leading-4 py-1.5 px-3 border border-bluedot-black rounded-[20px] text-bluedot-black transition-all duration-200 inline-block cursor-pointer data-hovered:border-bluedot-normal data-hovered:bg-bluedot-lighter data-focus-visible:border-bluedot-normal data-focus-visible:bg-bluedot-lighter data-focus-visible:outline-bluedot-normal data-focus-visible:outline-1 data-pressed:border-bluedot-normal data-[pressed=true]:bg-bluedot-normal data-[pressed=true]:text-white outline-hidden outline-offset-0 text-left', disabled && 'opacity-40 pointer-events-none', className);

  return (
    <LinkOrButton
      className={classes}
      onPress={onPress}
      href={href}
      target={target}
      disabled={disabled}
    >{children}
    </LinkOrButton>
  );
};
