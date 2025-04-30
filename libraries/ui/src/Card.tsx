import React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';

export type CardProps = {
  // Required
  title: string;
  // Optional
  children?: React.ReactNode;
  className?: string;
  ctaText?: string;
  ctaUrl?: string;
  imageClassName?: string;
  imageSrc?: string;
  isEntireCardClickable?: boolean;
  isFullWidth?: boolean;
  withCTA?: boolean;
  subtitle?: string;
  subtitleClassName?: string;
};

export const Card: React.FC<CardProps> = ({
  // Required
  title,
  // Optional
  children,
  className = '',
  ctaText,
  ctaUrl,
  imageClassName = '',
  imageSrc,
  isEntireCardClickable = false,
  isFullWidth = false,
  subtitle,
  subtitleClassName = '',
  withCTA = false,
}) => {
  const Wrapper = isEntireCardClickable ? 'a' : 'div';
  const wrapperClassName = clsx(
    'card flex items-start transition-transform duration-200',
    isFullWidth ? 'flex-row w-full' : 'flex-col',
    isEntireCardClickable && 'hover:scale-[1.01]',
    className,
  );

  const showCTA = withCTA || (!isEntireCardClickable && ctaUrl);
  const showBottomSection = !!(showCTA || children);

  return (
    <Wrapper
      href={isEntireCardClickable ? ctaUrl : undefined}
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

      <div className={clsx(
        'card__content flex gap-6 w-full flex-1 justify-between',
        isFullWidth ? 'flex-row w-full' : 'flex-col',
      )}>
        <div className="card__text">
          <p className="card__title bluedot-h4 mb-2">{title}</p>
          {subtitle && (<p className={`card__subtitle bluedot-p ${subtitleClassName}`}>{subtitle}</p>)}
        </div>
        {showBottomSection && (
          <div className="card__bottom-section flex flex-col gap-space-between">
            {showCTA && (
              <CTALinkOrButton
                className="card__cta"
                url={isEntireCardClickable ? undefined : ctaUrl}
                variant="secondary"
                withChevron={false}
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
