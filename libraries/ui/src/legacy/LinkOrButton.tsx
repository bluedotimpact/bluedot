import { PressEvent, Button as ReactAriaButton, Link as ReactAriaLink } from 'react-aria-components';

export type LinkOrButtonProps = React.PropsWithChildren<{
  className?: string;
  onPress?: (e: PressEvent) => void;
  href?: string,
  target?: React.HTMLAttributeAnchorTarget,
  disabled?: boolean;
}>;

export const LinkOrButton = ({
  children, className, onPress, disabled, href, target,
}: LinkOrButtonProps) => {
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
