import React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';
import { EXTERNAL_LINK_PROPS } from './utils';

type CardProps = {
  // Required
  title: string;
  // Optional
  imageSrc?: string;
  subtitle?: string;
  ctaUrl?: string;
  isExternalUrl?: boolean;
  className?: string;
  imageClassName?: string;
  subtitleClassName?: string;
  children?: React.ReactNode;
} & (
  | { ctaText: string; isEntireCardClickable?: false }
  | { ctaText?: string; isEntireCardClickable: true }
);

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
    'card flex flex-col items-start transition-transform duration-200 max-w-[323px]',
    isEntireCardClickable && 'hover:scale-[1.01]',
    className,
  );

  const showBottomSection = !!(!isEntireCardClickable || children);

  return (
    <Wrapper
      href={isEntireCardClickable ? ctaUrl : undefined}
      {...(isEntireCardClickable && isExternalUrl && ctaUrl && EXTERNAL_LINK_PROPS)}
      className={wrapperClassName}
    >
      {imageSrc && (
        <div className="card__image-container max-h-[223px] w-full mb-3">
          <img
            className={`card__image w-full max-h-full object-cover rounded-2xl ${imageClassName}`}
            src={imageSrc}
            alt={`${title}`}
          />
        </div>
      )}

      <div className="card__content flex flex-col gap-6 w-full flex-1 justify-between">
        <div className="card__text">
          <p className="card__title subtitle-sm mb-1">{title}</p>
          {subtitle && (<p className={`card__subtitle ${subtitleClassName}`}>{subtitle}</p>)}
        </div>
        {showBottomSection && (
          <div className="card__bottom-section mt-auto flex flex-col gap-space-between">
            {!isEntireCardClickable && (
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
