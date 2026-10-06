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

// `disabled:` attributes apply to buttons, `aria-disabled:` to links
const CTA_BASE_STYLES = 'cta-button flex items-center justify-center transition-all duration-200 w-fit whitespace-nowrap cursor-pointer not-prose disabled:opacity-50 disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:pointer-events-none';

const SIZE_STYLES = {
  small: 'h-9 px-3',
  medium: 'h-11 px-4',
  large: 'h-[50px] px-5',
} as const;

const CTA_VARIANT_STYLES = {
  primary: 'cta-button--primary bg-bluedot-normal link-on-dark',
  secondary: 'cta-button--secondary bg-transparent border border-bluedot-normal text-bluedot-normal hover:bg-bluedot-lighter',
  black: 'cta-button--black bg-bluedot-darker link-on-dark hover:bg-bluedot-darkest',
  'outline-black': 'cta-button--outline-black bg-transparent border border-bluedot-navy/30 text-black hover:bg-gray-50 font-medium',
  ghost: 'text-bluedot-navy/60 hover:text-bluedot-navy hover:bg-bluedot-navy/10',
  unstyled: '', // No color/hover styles - fully controlled by className/style props
} as const;

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
