import type React from 'react';
import { ClickTarget, type ClickTargetProps } from './ClickTarget';
import { Dots } from './ProgressDots';
import { cn } from './utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'outline-black' | 'unstyled';
export type ButtonTone = 'destructive' | 'success' | 'warning' | 'accent';

export type ButtonProps = {
  variant?: ButtonVariant;
  // Semantic colour for primary/secondary, `accent` for link; the other variants ignore it
  tone?: ButtonTone;
  size?: 'small' | 'medium' | 'large';
  // Leading dots + blocks activation without taking focus away. The label stays as passed; swap it yourself if the copy should change.
  // `loading` is the only way to set aria-busy, so the two cannot disagree
  loading?: boolean;
  style?: React.CSSProperties;
} & Omit<ClickTargetProps, 'aria-busy'>;

// `disabled:` applies to buttons, `aria-disabled:` to links. A busy control dims like disabled but keeps focus
const BASE_STYLES = 'not-prose flex w-fit cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-surface transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus on-dark:focus-visible:outline-focus-on-dark disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-busy:pointer-events-none aria-busy:opacity-50';

const SIZE_STYLES = {
  small: 'min-h-9 px-3 text-size-xs font-semibold',
  medium: 'min-h-11 px-4 text-size-xs font-semibold',
  large: 'min-h-[50px] px-5 text-size-sm font-medium',
} as const;

// Link mirrors SIZE_STYLES minus horizontal padding, and at a lighter weight since it is underlined text
const LINK_SIZE_STYLES: Record<keyof typeof SIZE_STYLES, string> = {
  small: 'min-h-9 text-size-xs font-medium',
  medium: 'min-h-11 text-size-xs font-medium',
  large: 'min-h-[50px] text-size-sm font-medium',
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-dark hover:bg-accent-hover on-dark:bg-accent-on-dark on-dark:text-bluedot-darker on-dark:hover:bg-accent-on-dark-hover',
  secondary:
    'border border-accent text-accent hover:bg-accent-subtle on-dark:border-border-on-dark on-dark:bg-surface-on-dark on-dark:text-on-dark on-dark:backdrop-blur-sm on-dark:hover:bg-surface-on-dark-hover',
  ghost:
    'text-secondary hover:bg-tint hover:text-primary on-dark:text-on-dark-secondary on-dark:hover:bg-surface-on-dark-subtle on-dark:hover:text-on-dark',
  link: 'whitespace-normal underline underline-offset-2 text-secondary hover:text-primary on-dark:text-on-dark-link on-dark:hover:text-on-dark-link-hover',
  'outline-black': 'border border-strong font-medium text-primary hover:bg-tint',
  unstyled: '', // No colour/hover styles: fully controlled by className/style
};

// Tone swaps the colour family; the chrome stays. Not every tone applies to every variant. Later classes win via cn()
const TONE_STYLES: Partial<Record<ButtonVariant, Partial<Record<ButtonTone, string>>>> = {
  primary: {
    destructive: 'bg-error-fg hover:bg-error-fg-hover',
    success: 'bg-success-fg hover:bg-success-fg-hover',
    warning: 'bg-warning-fg hover:bg-warning-fg-hover',
  },
  secondary: {
    destructive: 'border-error-fg text-error-fg hover:bg-error-bg',
    success: 'border-success-fg text-success-fg hover:bg-success-bg',
    warning: 'border-warning-fg text-warning-fg hover:bg-warning-bg',
  },
  link: {
    accent: 'text-link hover:text-link-hover',
    warning: 'text-warning-fg hover:text-warning-fg-hover',
  },
};

export const Button: React.FC<ButtonProps> = ({
  className,
  style,
  variant = 'primary',
  tone,
  size = 'medium',
  loading = false,
  children,
  ...rest
}) => {
  return (
    <ClickTarget
      className={cn(
        BASE_STYLES,
        variant === 'link' ? LINK_SIZE_STYLES[size] : SIZE_STYLES[size],
        VARIANT_STYLES[variant],
        tone && TONE_STYLES[variant]?.[tone],
        className,
      )}
      style={style}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Dots />}
      {children}
    </ClickTarget>
  );
};
