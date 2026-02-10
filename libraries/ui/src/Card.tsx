import type React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';
import { Tag } from './Tag';

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
  subtitle?: string;
  subtitleClassName?: string;
  subtitleBadge?: string;
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
  subtitleBadge,
}) => {
  const Wrapper = isEntireCardClickable ? 'a' : 'div';
  const wrapperClassName = clsx(
    'card flex items-start transition-transform duration-200',
    // Mobile: column layout, Desktop (md and up): row layout when isFullWidth is true
    isFullWidth ? 'flex-col md:flex-row w-full' : 'flex-col',
    isEntireCardClickable && 'hover:scale-[1.01]',
    className,
  );

  const showCTA = ctaText || (!isEntireCardClickable && ctaUrl);
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
      <div
        className={clsx(
          'card__content flex gap-6 w-full flex-1',
          // Mobile: column layout, Desktop (md and up): row layout when isFullWidth is true
          isFullWidth ? 'flex-col md:flex-row md:justify-between' : 'flex-col',
        )}
      >
        <div className="card__text">
          <div className="flex flex-row gap-4 items-center mb-2">
            <p className="card__title bluedot-h4">{title}</p>
            {subtitleBadge && <Tag variant="secondary">{subtitleBadge}</Tag>}
          </div>
          {subtitle && (<p className={`card__subtitle bluedot-p ${subtitleClassName}`}>{subtitle}</p>)}
          {/* For non-fullWidth cards, show CTA and children inline */}
          {!isFullWidth && showCTA && (
            <CTALinkOrButton
              className="card__cta mt-4"
              url={isEntireCardClickable ? undefined : ctaUrl}
              variant="secondary"
              withChevron
            >
              {ctaText}
            </CTALinkOrButton>
          )}
          {!isFullWidth && children && (
            <div className="card__footer flex items-center justify-between w-full mt-4">
              {children}
            </div>
          )}
        </div>
        {/* For isFullWidth cards, show CTA and children in a separate section */}
        {isFullWidth && showBottomSection && (
          <div className="card__bottom-section flex flex-col gap-space-between justify-center">
            {showCTA && (
              <CTALinkOrButton
                className="card__cta"
                url={isEntireCardClickable ? undefined : ctaUrl}
                variant="secondary"
                withChevron
              >
                {ctaText}
              </CTALinkOrButton>
            )}
            {children && (
              <div className="card__footer flex items-center justify-between w-full mt-4 md:mt-0">
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
