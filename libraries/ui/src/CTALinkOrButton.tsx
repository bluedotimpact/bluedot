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
  // Leading dots + blocks activation without taking focus away. The label stays as passed; swap it yourself if the copy should change.
  // `loading` is the only way to set aria-busy, so the two cannot disagree
  loading?: boolean;
  style?: React.CSSProperties;
} & Omit<ClickTargetProps, 'aria-busy'>;

// `disabled:` applies to buttons, `aria-disabled:` to links. A busy control dims like disabled but keeps focus
const BASE_STYLES = 'not-prose flex w-fit cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-surface text-size-xs font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus on-dark:focus-visible:outline-focus-on-dark disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-busy:pointer-events-none aria-busy:opacity-50';

const SIZE_STYLES = {
  small: 'h-9 px-3',
  medium: 'h-11 px-4',
  large: 'h-[50px] px-5',
} as const;

const VARIANT_STYLES: Record<CTALinkOrButtonVariant, string> = {
  primary:
    'bg-accent text-on-dark hover:bg-accent-hover on-dark:bg-accent-on-dark on-dark:text-bluedot-darker on-dark:hover:bg-accent-on-dark-hover',
  secondary:
    'border border-accent text-accent hover:bg-accent-subtle on-dark:border-border-on-dark on-dark:bg-surface-on-dark on-dark:text-on-dark on-dark:backdrop-blur-sm on-dark:hover:bg-surface-on-dark-hover',
  ghost:
    'text-secondary hover:bg-tint hover:text-primary on-dark:text-on-dark-secondary on-dark:hover:bg-surface-on-dark-subtle on-dark:hover:text-on-dark',
  black: 'bg-dark text-on-dark hover:bg-bluedot-black',
  'outline-black': 'border border-strong font-medium text-primary hover:bg-tint',
  unstyled: '', // No colour/hover styles: fully controlled by className/style
};

// Tone swaps the colour family; the primary/secondary chrome stays. Later classes win via cn()
const TONE_STYLES: Partial<Record<CTALinkOrButtonVariant, Record<CTALinkOrButtonTone, string>>> = {
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
  return (
    <ClickTarget
      className={cn(
        BASE_STYLES,
        SIZE_STYLES[size],
        VARIANT_STYLES[variant],
        tone && TONE_STYLES[variant]?.[tone],
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
