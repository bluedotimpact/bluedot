import type React from 'react';
import NextLink from 'next/link';

export type ClickTargetProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  onClick?: ((e: React.BaseSyntheticEvent) => void);
  url?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
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
  title,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
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
        title={title}
        aria-disabled={disabled ? 'true' : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
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
      title={title}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}

      // eslint-disable-next-line no-nested-ternary
      type={type === 'submit' ? 'submit' : type === 'reset' ? 'reset' : 'button'}
    >
      {children}
    </button>
  );
};
