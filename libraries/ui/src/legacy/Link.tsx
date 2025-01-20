import clsx from 'clsx';
import { LinkOrButton, LinkOrButtonProps } from './LinkOrButton';

export type LinkProps = LinkOrButtonProps;

export const Link = ({
  children, className, onPress, disabled, href, target,
}: LinkProps) => {
  const classes = clsx('underline', className);

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
