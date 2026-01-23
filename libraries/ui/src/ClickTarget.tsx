import React from 'react';
import NextLink from 'next/link';

export type ClickTargetProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  onClick?: ((e: React.BaseSyntheticEvent) => void);
  url?: string,
  target?: React.HTMLAttributeAnchorTarget,
  rel?: string;
  disabled?: boolean;
  'aria-label'?: string;
  type?: 'button' | 'submit' | 'reset';
}>;

export const ClickTarget = ({
  children,
  className,
  style,
  onClick,
  disabled,
  url,
  target,
  rel,
  'aria-label': ariaLabel,
  type = 'button',
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
        style={style}
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
      style={style}
      onClick={handleInteraction}
      disabled={disabled}
      aria-label={ariaLabel}
      // eslint-disable-next-line no-nested-ternary -- required by react/button-has-type
      type={type === 'submit' ? 'submit' : type === 'reset' ? 'reset' : 'button'}
    >
      {children}
    </button>
  );
};
