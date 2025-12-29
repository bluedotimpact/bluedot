import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { ClickTarget, ClickTargetProps } from './ClickTarget';
import { cn } from './utils';

export type CTALinkOrButtonProps = {
  variant?: 'primary' | 'secondary' | 'black' | 'outline-black' | 'ghost' | 'unstyled';
  size?: 'small' | 'medium';
  withChevron?: boolean;
  withBackChevron?: boolean;
  style?: React.CSSProperties;
} & ClickTargetProps;

// `disabled:` attributes apply to buttons, `aria-disabled:` to links
const CTA_BASE_STYLES = 'cta-button flex items-center justify-center transition-all duration-200 w-fit whitespace-nowrap cursor-pointer not-prose disabled:opacity-50 disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:pointer-events-none';

const CTA_SIZE_STYLES = {
  small: 'text-[13px] px-3 py-2.5 h-9 rounded-md font-semibold',
  medium: 'text-sm px-4 py-3 rounded-sm font-[650]',
} as const;

const CTA_VARIANT_STYLES = {
  primary: 'cta-button--primary bg-bluedot-normal link-on-dark',
  secondary: 'cta-button--secondary bg-transparent border border-bluedot-normal text-bluedot-normal hover:bg-bluedot-lighter',
  black: 'cta-button--black bg-bluedot-darker link-on-dark hover:bg-bluedot-darkest',
  'outline-black': 'cta-button--outline-black bg-transparent border border-[rgba(19,19,46,0.3)] text-black hover:bg-gray-50 font-medium',
  ghost: '[--ghost-gray:#13132E] text-(--ghost-gray)/60 hover:text-(--ghost-gray) hover:bg-(--ghost-gray)/10',
  unstyled: '', // No color/hover styles - fully controlled by className/style props
} as const;

export const CTALinkOrButton: React.FC<CTALinkOrButtonProps> = ({
  className,
  style,
  variant = 'primary',
  size = 'medium',
  withChevron = false,
  withBackChevron = false,
  children,
  ...rest
}) => {
  return (
    <ClickTarget
      className={cn(
        CTA_BASE_STYLES,
        CTA_SIZE_STYLES[size],
        CTA_VARIANT_STYLES[variant],
        className,
      )}
      style={style}
      {...rest}
    >
      {withBackChevron && (
      <span className="cta-button__chevron mr-3">
        <FaChevronLeft className="cta-button__chevron-icon size-2" />
      </span>
      )}
      {children}
      {withChevron && (
      <span className="cta-button__chevron ml-3">
        <FaChevronRight className="cta-button__chevron-icon size-2" />
      </span>
      )}
    </ClickTarget>
  );
};
