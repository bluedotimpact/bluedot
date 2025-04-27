import { PressEvent, Button as ReactAriaButton, Link as ReactAriaLink } from 'react-aria-components';
import NextLink from 'next/link';

export type ClickTargetProps = React.PropsWithChildren<{
  className?: string;
  onClick?: ((e: PressEvent) => void) | (() => void);
  url?: string,
  target?: React.HTMLAttributeAnchorTarget,
  disabled?: boolean;
  'aria-label'?: string;
}>;

export const ClickTarget = ({
  children, className, onClick, disabled, url, target, 'aria-label': ariaLabel,
}: ClickTargetProps) => {
  if (url) {
    return (
      <NextLink
        href={url}
        passHref
        legacyBehavior
      >
        <ReactAriaLink
          className={className}
          onPress={onClick ? (e) => { e.continuePropagation(); return onClick(e); } : undefined}
          href={url}
          target={target}
          isDisabled={disabled}
          aria-label={ariaLabel}
        >
          {children}
        </ReactAriaLink>
      </NextLink>
    );
  }

  return (
    <ReactAriaButton
      className={className}
      onPress={onClick ? (e) => { e.continuePropagation(); return onClick(e); } : undefined}
      isDisabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </ReactAriaButton>
  );
};
