import clsx from 'clsx';
import React from 'react';
import { EXTERNAL_LINK_PROPS } from './utils/externalLinkProps';

export type CTAProps = {
  className?: string;
  variant?: 'primary' | 'secondary';
  withChevron?: boolean;
  withBackChevron?: boolean;
  children: React.ReactNode;
  url?: string;
  isExternalUrl?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const CTA_BASE_STYLES = 'cta-button flex items-center justify-center rounded-radius-sm transition-all duration-200 text-sm px-4 py-3 w-fit font-[650] whitespace-nowrap';

const CTA_VARIANT_STYLES = {
  primary: 'cta-button--primary bg-bluedot-normal link-on-dark',
  secondary: 'cta-button--secondary bg-transparent border border-bluedot-normal text-bluedot-normal hover:bg-bluedot-lighter',
} as const;

export const CTALinkOrButton: React.FC<CTAProps> = ({
  className,
  variant = 'primary',
  withChevron = false,
  withBackChevron = false,
  children,
  url,
  isExternalUrl = false,
  ...rest
}) => {
  const commonClassNames = clsx(
    CTA_BASE_STYLES,
    CTA_VARIANT_STYLES[variant],
    className,
  );

  if (url) {
    return (
      <a
        href={url}
        {...(isExternalUrl && EXTERNAL_LINK_PROPS)}
        data-testid="cta-link"
        className={commonClassNames}
      >
        {withBackChevron && (
          <span className="cta-button__chevron mr-3">
            <img
              src={variant === 'primary' ? '/icons/chevron_white.svg' : '/icons/chevron_blue.svg'}
              alt="←"
              className="cta-button__chevron-icon size-2 rotate-180"
            />
          </span>
        )}
        <span className="cta-button__text">{children}</span>
        {withChevron && (
          <span className="cta-button__chevron ml-3">
            <img
              src={variant === 'primary' ? '/icons/chevron_white.svg' : '/icons/chevron_blue.svg'}
              alt="→"
              className="cta-button__chevron-icon size-2"
            />
          </span>
        )}
      </a>
    );
  }

  return (
    <button
      type="button"
      data-testid="cta-button"
      className={commonClassNames}
      {...rest}
    >
      <span className="cta-button__text">{children}</span>
      {withChevron && (
        <span className="cta-button__chevron ml-3">
          <img
            src={variant === 'primary' ? '/icons/chevron_white.svg' : '/icons/chevron_blue.svg'}
            alt="→"
            className="cta-button__chevron-icon size-2"
          />
        </span>
      )}
    </button>
  );
};

export default CTALinkOrButton;
