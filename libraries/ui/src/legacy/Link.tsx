import clsx from 'clsx';
import { LinkOrButton, LinkOrButtonProps } from './LinkOrButton';

export type LinkProps = LinkOrButtonProps;

export const Link = ({
  children, className, onPress, disabled, url, target,
}: LinkProps) => {
  const classes = clsx('underline', className);

  return (
    <LinkOrButton
      className={classes}
      onPress={onPress}
      url={url}
      target={target}
      disabled={disabled}
    >{children}
    </LinkOrButton>
  );
};
