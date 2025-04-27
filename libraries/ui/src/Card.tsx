import React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';
import { EXTERNAL_LINK_PROPS } from './utils/externalLinkProps';

export type CardProps = {
  // Required
  title: string;
  // Optional
  imageSrc?: string;
  subtitle?: string;
  ctaUrl?: string;
  ctaText?: string;
  isEntireCardClickable?: boolean;
  isExternalUrl?: boolean;
  className?: string;
  imageClassName?: string;
  subtitleClassName?: string;
  children?: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({
  imageSrc,
  title,
  subtitle,
  ctaUrl,
  ctaText,
  isEntireCardClickable = false,
  isExternalUrl = false,
  className = '',
  imageClassName = '',
  subtitleClassName = '',
  children,
}) => {
  const Wrapper = isEntireCardClickable ? 'a' : 'div';
  const wrapperClassName = clsx(
    'card flex flex-col items-start transition-transform duration-200',
    isEntireCardClickable && 'hover:scale-[1.01]',
    className,
  );

  const showCTA = !isEntireCardClickable && ctaUrl;
  const showBottomSection = !!(showCTA || children);

  return (
    <Wrapper
      href={isEntireCardClickable ? ctaUrl : undefined}
      {...(isEntireCardClickable && isExternalUrl && EXTERNAL_LINK_PROPS)}
      className={wrapperClassName}
    >
      {imageSrc && (
        <div className="card__image-container w-full mb-4">
          <img
            className={`card__image max-w-full max-h-full object-cover rounded-lg ${imageClassName}`}
            src={imageSrc}
            alt={`${title}`}
          />
        </div>
      )}

      <div className="card__content flex flex-col gap-6 w-full flex-1 justify-between">
        <div className="card__text">
          <p className="card__title bluedot-h4 mb-2">{title}</p>
          {subtitle && (<p className={`card__subtitle bluedot-p ${subtitleClassName}`}>{subtitle}</p>)}
        </div>
        {showBottomSection && (
          <div className="card__bottom-section flex flex-col gap-space-between">
            {showCTA && (
              <CTALinkOrButton
                className="card__cta"
                url={ctaUrl}
                variant="secondary"
                withChevron={false}
                isExternalUrl={isExternalUrl}
              >
                {ctaText}
              </CTALinkOrButton>
            )}
            {children && (
              <div className="card__footer flex items-center justify-between w-full">
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    </Wrapper>
  );
};

export default Card;
