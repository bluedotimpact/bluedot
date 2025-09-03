import clsx from 'clsx';
import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { ClickTarget, ClickTargetProps } from './ClickTarget';

export type CTALinkOrButtonProps = {
  variant?: 'primary' | 'secondary' | 'black' | 'outline-black' | 'ghost';
  size?: 'small' | 'medium';
  withChevron?: boolean;
  withBackChevron?: boolean;
} & ClickTargetProps;

const CTA_BASE_STYLES = 'cta-button flex items-center justify-center transition-all duration-200 w-fit whitespace-nowrap cursor-pointer not-prose';

const CTA_SIZE_STYLES = {
  small: 'text-[13px] px-3 py-2.5 h-9 gap-1.5 rounded-md font-semibold',
  medium: 'text-sm px-4 py-3 gap-2 rounded-sm font-[650]',
} as const;

const CTA_VARIANT_STYLES = {
  primary: 'cta-button--primary bg-bluedot-normal link-on-dark',
  secondary: 'cta-button--secondary bg-transparent border border-bluedot-normal text-bluedot-normal hover:bg-bluedot-lighter',
  black: 'cta-button--black bg-bluedot-darker link-on-dark hover:bg-bluedot-darkest',
  'outline-black': 'cta-button--outline-black bg-transparent border border-black text-black hover:bg-gray-50',
  ghost: '[--ghost-gray:#13132E] text-(--ghost-gray)/60 hover:text-(--ghost-gray) hover:bg-(--ghost-gray)/10',
} as const;

export const CTALinkOrButton: React.FC<CTALinkOrButtonProps> = ({
  className,
  variant = 'primary',
  size = 'medium',
  withChevron = false,
  withBackChevron = false,
  children,
  ...rest
}) => {
  return (
    <ClickTarget
      className={clsx(
        CTA_BASE_STYLES,
        CTA_SIZE_STYLES[size],
        CTA_VARIANT_STYLES[variant],
        className,
      )}
      {...rest}
    >
      {withBackChevron && <FaChevronLeft className="cta-button__chevron-icon size-2" />}
      {children}
      {withChevron && <FaChevronRight className="cta-button__chevron-icon size-2" />}
    </ClickTarget>
  );
};
