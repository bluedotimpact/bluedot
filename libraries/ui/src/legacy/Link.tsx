import clsx from 'clsx';
import { ClickTarget, LinkOrButtonProps } from '../ClickTarget';

export type LinkProps = LinkOrButtonProps;

export const Link = ({
  children, className, onPress, disabled, url, target,
}: LinkProps) => {
  const classes = clsx('underline', className);

  return (
    <ClickTarget
      className={classes}
      onPress={onPress}
      url={url}
      target={target}
      disabled={disabled}
    >{children}
    </ClickTarget>
  );
};
