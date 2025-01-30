import React from 'react';
import { CTALinkOrButton } from './CTALinkOrButton';

interface CardProps {
  imageSrc: string;
  title: string;
  subtitle?: string;
  ctaUrl?: string;
  isExternalUrl?: boolean;
  className?: string;
  imageClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  imageSrc,
  title,
  subtitle,
  ctaUrl,
  isExternalUrl = false,
  className = '',
  imageClassName = '',
}) => {
  return (
    <div className={`card flex flex-col items-start ${className}`}>
      <div className="card__image-container w-[323px] h-[223px] mb-3">
        <img
          className={`card__image size-full object-cover rounded-2xl ${imageClassName}`}
          src={imageSrc}
          alt={`${title}`}
        />
      </div>

      <div className="card__content flex flex-col gap-8 w-full">
        <div className="card__text">
          <h2 className="card__title text-2xl font-semibold text-bluedot-darker">{title}</h2>
          {subtitle && (<p className="card__subtitle text-base text-black">{subtitle}</p>)}
        </div>

        <CTALinkOrButton
          url={ctaUrl}
          variant="secondary"
          withChevron={false}
          isExternalUrl={isExternalUrl}
        >
          LinkedIn
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export default Card;
