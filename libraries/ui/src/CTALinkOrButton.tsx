import clsx from 'clsx';
import React from 'react';

export type CTAProps = {
  className?: string;
  variant?: 'primary' | 'secondary';
  withChevron?: boolean;
  children: React.ReactNode;
  url?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const CTALinkOrButton: React.FC<CTAProps> = ({
  className,
  variant = 'primary',
  withChevron = false,
  children,
  url,
  ...rest
}) => {
  if (url) {
    return (
      <a
        href={url}
        rel="noopener noreferrer"
        className={clsx(
          'cta-button flex items-center justify-center rounded-lg transition-all duration-200 font-semibold text-base',
          {
            'cta-button--primary bg-bluedot-normal text-white hover:bg-bluedot-normal': variant === 'primary',
            'cta-button--secondary bg-transparent text-bluedot-normal border border-bluedot-normal hover:bg-bluedot-lighter': variant === 'secondary',
          },
          'px-4 py-2',
          className,
        )}
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
      className={clsx(
        'cta-button flex items-center justify-center rounded-lg transition-all duration-200 font-semibold text-base',
        {
          'cta-button--primary bg-bluedot-normal text-white hover:bg-bluedot-normal': variant === 'primary',
          'cta-button--secondary bg-transparent text-bluedot-normal border border-bluedot-normal hover:bg-bluedot-lighter': variant === 'secondary',
        },
        'px-4 py-2',
        className,
      )}
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
