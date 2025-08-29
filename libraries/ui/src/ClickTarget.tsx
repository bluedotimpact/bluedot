import React from 'react';
import NextLink from 'next/link';

export type ClickTargetProps = React.PropsWithChildren<{
  className?: string;
  onClick?: ((e: React.BaseSyntheticEvent) => void);
  url?: string,
  target?: React.HTMLAttributeAnchorTarget,
  disabled?: boolean;
  'aria-label'?: string;
}>;

export const ClickTarget = ({
  children, className, onClick, disabled, url, target, 'aria-label': ariaLabel,
}: ClickTargetProps) => {
  const handleInteraction = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    // For keyboard events, only proceed for Enter and Space
    if (e.type === 'keydown') {
      const keyEvent = e as React.KeyboardEvent;
      if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') {
        return;
      }
      // Prevent default for space key to avoid page scrolling
      if (keyEvent.key === ' ') {
        e.preventDefault();
      }
    }

    onClick?.(e);
  };

  if (url) {
    return (
      <NextLink
        href={url}
        className={className}
        onClick={handleInteraction}
        onKeyDown={handleInteraction}
        target={target}
        aria-disabled={disabled ? 'true' : undefined}
        aria-label={ariaLabel}
        tabIndex={disabled ? -1 : 0}
      >
        {children}
      </NextLink>
    );
  }

  return (
    <button
      className={className}
      onClick={handleInteraction}
      onKeyDown={handleInteraction}
      disabled={disabled}
      aria-label={ariaLabel}
      type="button"
    >
      {children}
    </button>
  );
};
