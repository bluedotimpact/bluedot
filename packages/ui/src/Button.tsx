import clsx from 'clsx';
import { PressEvent, Button as ReactAriaButton, Link as ReactAriaLink } from 'react-aria-components';

export type ButtonProps = React.PropsWithChildren<{
  className?: string;
  onPress?: (e: PressEvent) => void;
  href?: string,
  target?: React.HTMLAttributeAnchorTarget,
  disabled?: boolean;
}>;

export const Button = ({
  children, className, onPress, disabled, href, target,
}: ButtonProps) => {
  const classes = clsx('text-base font-normal leading-4 py-1.5 px-3 border border-black rounded-[20px] text-black transition-all duration-200 inline-block cursor-pointer data-[hovered]:border-bluedot-normal data-[hovered]:bg-bluedot-lighter data-[focus-visible]:border-bluedot-normal data-[focus-visible]:bg-bluedot-lighter data-[pressed]:border-bluedot-normal data-[pressed=true]:bg-bluedot-normal data-[pressed=true]:text-white outline-none', className);

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

export const LinkOrButton = ({
  children, className, onPress, disabled, href, target,
}: ButtonProps) => {
  if (href) {
    return (
      <ReactAriaLink
        className={className}
        onPress={onPress}
        href={href}
        target={target}
        isDisabled={disabled}
      >{children}
      </ReactAriaLink>
    );
  }

  return (
    <ReactAriaButton
      className={className}
      onPress={onPress}
      isDisabled={disabled}
    >{children}
    </ReactAriaButton>
  );
};
