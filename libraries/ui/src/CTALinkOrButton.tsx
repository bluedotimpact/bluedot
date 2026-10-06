import type React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { ClickTarget, type ClickTargetProps } from './ClickTarget';
import { Dots } from './ProgressDots';
import { cn } from './utils';

export type CTALinkOrButtonVariant = 'primary' | 'secondary' | 'ghost' | 'black' | 'outline-black' | 'unstyled';
export type CTALinkOrButtonTone = 'destructive' | 'success' | 'warning';

export type CTALinkOrButtonProps = {
  variant?: CTALinkOrButtonVariant;
  // Semantic colour for primary/secondary; the other variants ignore it
  tone?: CTALinkOrButtonTone;
  size?: 'small' | 'medium' | 'large';
  withChevron?: boolean;
  withBackChevron?: boolean;
  // Leading dots + blocks activation without taking focus away. The label stays as passed; swap it yourself if the copy should change
  loading?: boolean;
  style?: React.CSSProperties;
} & ClickTargetProps;

// `disabled:` applies to buttons, `aria-disabled:` to links. A busy control stays at full opacity but ignores input
const BASE_STYLES = 'not-prose flex w-fit cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-surface text-size-xs font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus on-dark:focus-visible:outline-focus-on-dark disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-busy:pointer-events-none';

const SIZE_STYLES = {
  small: 'h-9 px-3',
  medium: 'h-11 px-4',
  large: 'h-[50px] px-5',
} as const;

const VARIANT_STYLES: Record<CTALinkOrButtonVariant, string> = {
  primary: 'bg-accent text-on-dark hover:bg-accent-hover hover:text-on-dark on-dark:bg-accent-on-dark on-dark:text-bluedot-darker on-dark:hover:bg-accent-on-dark-hover on-dark:hover:text-bluedot-darker',
  secondary: 'border border-accent text-accent hover:bg-accent-subtle hover:text-accent on-dark:border-border-on-dark on-dark:bg-surface-on-dark on-dark:text-on-dark on-dark:backdrop-blur-sm on-dark:hover:bg-surface-on-dark-hover on-dark:hover:text-on-dark',
  ghost: 'text-secondary hover:bg-tint hover:text-primary on-dark:text-on-dark-secondary on-dark:hover:bg-surface-on-dark-subtle on-dark:hover:text-on-dark',
  black: 'bg-dark text-on-dark hover:bg-bluedot-black hover:text-on-dark',
  'outline-black': 'border border-strong font-medium text-primary hover:bg-tint hover:text-primary',
  unstyled: '', // No colour/hover styles: fully controlled by className/style
};

// Tone swaps the colour family; the primary/secondary chrome stays. Later classes win via cn()
const TONE_STYLES: Record<'primary' | 'secondary', Record<CTALinkOrButtonTone, string>> = {
  primary: {
    destructive: 'bg-error-fg hover:bg-error-fg-hover',
    success: 'bg-success-fg hover:bg-success-fg-hover',
    warning: 'bg-warning-fg hover:bg-warning-fg-hover',
  },
  secondary: {
    destructive: 'border-error-fg text-error-fg hover:bg-error-bg hover:text-error-fg',
    success: 'border-success-fg text-success-fg hover:bg-success-bg hover:text-success-fg',
    warning: 'border-warning-fg text-warning-fg hover:bg-warning-bg hover:text-warning-fg',
  },
};

export const CTALinkOrButton: React.FC<CTALinkOrButtonProps> = ({
  className,
  style,
  variant = 'primary',
  tone,
  size = 'medium',
  withChevron = false,
  withBackChevron = false,
  loading = false,
  children,
  ...rest
}) => {
  const chevronClassName = cn('cta-button__chevron-icon', size === 'large' ? 'size-3' : 'size-2');
  return (
    <ClickTarget
      className={cn(
        CTA_BASE_STYLES,
        CTA_SIZE_STYLES[size],
        CTA_VARIANT_STYLES[variant],
        className,
      )}
      style={style}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Dots />}
      {withBackChevron && <FaChevronLeft aria-hidden className="size-4" />}
      {children}
      {withChevron && <FaChevronRight aria-hidden className="size-4" />}
    </ClickTarget>
  );
};
