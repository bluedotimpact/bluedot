import { PressEvent, Button as ReactAriaButton, Link as ReactAriaLink } from 'react-aria-components';

export type LinkOrButtonProps = React.PropsWithChildren<{
  className?: string;
  onPress?: (e: PressEvent) => void;
  url?: string,
  target?: React.HTMLAttributeAnchorTarget,
  disabled?: boolean;
  'aria-label'?: string;
}>;

export const LinkOrButton = ({
  children, className, onPress, disabled, url, target, 'aria-label': ariaLabel,
}: LinkOrButtonProps) => {
  if (url) {
    return (
      <ReactAriaLink
        className={className}
        onPress={onPress}
        href={url}
        target={target}
        isDisabled={disabled}
        aria-label={ariaLabel}
      >{children}
      </ReactAriaLink>
    );
  }

  return (
    <ReactAriaButton
      className={className}
      onPress={onPress}
      isDisabled={disabled}
      aria-label={ariaLabel}
    >{children}
    </ReactAriaButton>
  );
};
