import React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';
import { EXTERNAL_LINK_PROPS } from './utils';

interface CardProps {
  imageSrc: string;
  title: string;
  subtitle?: string;
  footerContent?: React.ReactNode;
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
  footerContent,
  ctaUrl,
  ctaText,
  isEntireCardClickable = false,
  isExternalUrl = false,
  className = '',
  imageClassName = '',
}) => {
  const Wrapper = isEntireCardClickable ? 'a' : 'div';
  const wrapperClassName = clsx(
    'card flex flex-col items-start transition-transform duration-200',
    isEntireCardClickable && 'hover:scale-[1.01]',
    className,
  );

  return (
    <Wrapper
      href={isEntireCardClickable ? ctaUrl : undefined}
      {...(isEntireCardClickable && isExternalUrl && ctaUrl && EXTERNAL_LINK_PROPS)}
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
          <h2 className="card__title text-2xl font-[650] text-bluedot-darker mb-1">{title}</h2>
          {subtitle && (<p className="card__subtitle text-sm text-bluedot-black">{subtitle}</p>)}
        </div>

        <div className="card__footer-row flex items-center justify-between mt-auto w-full">
          {footerContent && (
            <div className="card__footer-content text-left text-xs text-bluedot-black flex-1">
              {footerContent}
            </div>
          )}
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
        </div>
      </div>
    </Wrapper>
  );
};

export default Card;
