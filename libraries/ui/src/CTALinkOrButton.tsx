import clsx from 'clsx';
import React from 'react';

export type CTAProps = {
  className?: string;
  variant?: 'primary' | 'secondary';
  withChevron?: boolean;
  children: React.ReactNode;
  url?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const CTA_BASE_STYLES = 'cta-button flex items-center justify-center rounded-lg transition-all duration-200 font-semibold text-base px-4 py-2';

const CTA_VARIANT_STYLES = {
  primary: 'cta-button--primary bg-bluedot-normal text-white hover:bg-bluedot-normal',
  secondary: 'cta-button--secondary bg-transparent text-bluedot-normal border border-bluedot-normal hover:bg-bluedot-lighter',
} as const;

export const CTALinkOrButton: React.FC<CTAProps> = ({
  className,
  variant = 'primary',
  withChevron = false,
  children,
  url,
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
        data-testid="cta-link"
        className={commonClassNames}
      >
        <span className="cta-button__text">{children}</span>
        {withChevron && (
          <span className="cta-button__chevron ml-3">
            <img
              src={variant === 'primary' ? '/icons/chevron_white.svg' : '/icons/chevron_blue.svg'}
              alt="→"
              className="cta-button__chevron-icon w-2 h-2"
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
            className="cta-button__chevron-icon w-2 h-2"
          />
        </span>
      )}
    </button>
  );
};

export default CTALinkOrButton;
