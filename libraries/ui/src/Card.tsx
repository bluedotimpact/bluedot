import React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';
import { EXTERNAL_LINK_PROPS } from './utils';

interface CardProps {
  imageSrc: string;
  title: string;
  subtitle?: string;
  ctaMetadata?: string;
  ctaText: string;
  ctaUrl?: string;
  isEntireCardClickable?: boolean;
  isExternalUrl?: boolean;
  className?: string;
  imageClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  imageSrc,
  title,
  subtitle,
  ctaMetadata,
  ctaUrl,
  ctaText,
  isEntireCardClickable = false,
  isExternalUrl = false,
  className = '',
  imageClassName = '',
}) => {
  const Wrapper = isEntireCardClickable && ctaUrl ? 'a' : 'div';
  const wrapperClassName = clsx(
    'card flex flex-col items-start transition-transform duration-200',
    isEntireCardClickable && 'hover:scale-[1.01]',
    className,
  );

  return (
    <Wrapper
      href={isEntireCardClickable ? ctaUrl : undefined}
      {...(isEntireCardClickable && isExternalUrl && EXTERNAL_LINK_PROPS)}
      className={wrapperClassName}
    >
      <div className="card__image-container max-w-[323px] max-h-[223px] w-full mb-3">
        <img
          className={`card__image w-full max-h-full object-cover rounded-2xl ${imageClassName}`} 
          src={imageSrc}
          alt={`${title}`}
        />
      </div>

      <div className="card__content flex flex-col gap-6 w-full flex-1 justify-between">
        <div className="card__text">
          <h2 className="card__title text-2xl font-semibold text-bluedot-darker mb-1">{title}</h2>
          {subtitle && (<p className="card__subtitle text-base text-bluedot-black">{subtitle}</p>)}
        </div>

        <div className="card__cta-row flex items-center justify-between mt-auto">
          {ctaMetadata && (
            <p className="card__cta-metadata text-left text-xs text-bluedot-black">
              {ctaMetadata}
            </p>
          )}
          <CTALinkOrButton
            className="card__cta"
            url={!isEntireCardClickable ? ctaUrl : undefined}
            variant="secondary"
            withChevron={false}
            isExternalUrl={isExternalUrl}
          >
            {ctaText}
          </CTALinkOrButton>
        </div>
      </div>
    </Wrapper>
  );
};

export default Card;
