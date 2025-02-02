import React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';
import { EXTERNAL_LINK_PROPS } from './utils';

type CardProps = {
  title: string;
  subtitle?: string;
  footerContent?: React.ReactNode;
  ctaUrl?: string;
  isExternalUrl?: boolean;
  className?: string;
  subtitleClassName?: string;
} & (
  | { ctaText: string; isEntireCardClickable?: false }
  | { ctaText?: string; isEntireCardClickable: true }
) & (
  | { imageSrc: string; imageClassName?: string; imageNode?: never }
  | { imageNode: React.ReactNode; imageSrc?: never; imageClassName?: never }
);

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  footerContent,
  ctaUrl,
  ctaText,
  isEntireCardClickable = false,
  isExternalUrl = false,
  className = '',
  imageSrc,
  subtitleClassName = '',
  imageClassName = '',
  imageNode,
}) => {
  const Wrapper = isEntireCardClickable ? 'a' : 'div';
  const wrapperClassName = clsx(
    'card flex flex-col items-start min-w-min-width transition-transform duration-200',
    isEntireCardClickable && 'hover:scale-[1.01] hover:container-elevated',
    className,
  );

  return (
    <Wrapper
      href={isEntireCardClickable ? ctaUrl : undefined}
      {...(isEntireCardClickable && isExternalUrl && ctaUrl && EXTERNAL_LINK_PROPS)}
      className={wrapperClassName}
    >
      <div className="card__image-container max-w-[323px] max-h-[223px] w-full mb-3">
        {/* If an element (may or may not be an <img>) is given, use that, otherwise use the image at `imageSrc` */}
        {imageNode || (
          <img
            className={`card__image w-full max-h-full object-cover rounded-2xl ${imageClassName}`}
            src={imageSrc}
            alt={`${title}`}
          />
        )}
      </div>

      <div className="card__content flex flex-col gap-6 w-full flex-1 justify-between">
        <div className="card__text">
          <h2 className="card__title text-xl font-[650] text-bluedot-darker mb-1">{title}</h2>
          {subtitle && (<p className={`card__subtitle text-sm text-bluedot-black ${subtitleClassName}`}>{subtitle}</p>)}
        </div>
        <div className="card__bottom-section mt-auto flex flex-col gap-4">
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
          {footerContent && (
            <div className="card__footer flex items-center justify-between w-full">
              {footerContent}
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default Card;
