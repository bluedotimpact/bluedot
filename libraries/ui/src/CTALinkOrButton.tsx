import clsx from 'clsx';
import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { ClickTarget, ClickTargetProps } from './ClickTarget';

export type CTALinkOrButtonProps = {
  variant?: 'primary' | 'secondary';
  withChevron?: boolean;
  withBackChevron?: boolean;
} & ClickTargetProps;

const CTA_BASE_STYLES = 'cta-button flex items-center justify-center rounded-sm transition-all duration-200 text-sm px-4 py-3 w-fit font-[650] whitespace-nowrap cursor-pointer not-prose';

const CTA_VARIANT_STYLES = {
  primary: 'cta-button--primary bg-bluedot-normal link-on-dark',
  secondary: 'cta-button--secondary bg-transparent border border-bluedot-normal text-bluedot-normal hover:bg-bluedot-lighter',
} as const;

export const CTALinkOrButton: React.FC<CTALinkOrButtonProps> = ({
  className,
  variant = 'primary',
  withChevron = false,
  withBackChevron = false,
  children,
  ...rest
}) => {
  return (
    <ClickTarget
      className={clsx(
        CTA_BASE_STYLES,
        CTA_VARIANT_STYLES[variant],
        className,
      )}
      {...rest}
    >
      {withBackChevron && (
      <span className="cta-button__chevron mr-3">
        <FaChevronLeft className="cta-button__chevron-icon size-2" />
      </span>
      )}
      <span className="cta-button__text">{children}</span>
      {withChevron && (
      <span className="cta-button__chevron ml-3">
        <FaChevronRight className="cta-button__chevron-icon size-2" />
      </span>
      )}
    </ClickTarget>
  );
};
