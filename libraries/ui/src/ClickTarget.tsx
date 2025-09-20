import React from 'react';
import NextLink from 'next/link';

export type ClickTargetProps = React.PropsWithChildren<{
  className?: string;
  onClick?: ((e: React.BaseSyntheticEvent) => void);
  url?: string,
  target?: React.HTMLAttributeAnchorTarget,
  rel?: string;
  disabled?: boolean;
  'aria-label'?: string;
}>;

export const ClickTarget = ({
  children,
  className,
  onClick,
  disabled,
  url,
  target,
  rel,
  'aria-label': ariaLabel,
}: ClickTargetProps) => {
  const safeRel = target === '_blank'
    ? Array.from(new Set(['noopener', 'noreferrer', ...(rel?.split(/\s+/).filter(Boolean) ?? [])])).join(' ')
    : rel;

  const handleInteraction = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  if (url) {
    return (
      <NextLink
        href={url}
        className={className}
        onClick={handleInteraction}
        target={target}
        rel={safeRel}
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
      disabled={disabled}
      aria-label={ariaLabel}
      type="button"
    >
      {children}
    </button>
  );
};
