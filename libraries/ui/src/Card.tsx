import React from 'react';
import { CTALinkOrButton } from './CTALinkOrButton';

interface CardProps {
  imageSrc: string;
  title: string;
  subtitle?: string;
  ctaUrl?: string;
}

export const Card: React.FC<CardProps> = ({
  imageSrc,
  title,
  subtitle,
  ctaUrl,
}) => {
  return (
    <div className="card w-80 h-80 flex flex-col items-start">
      <div className="card__image-container w-full h-48 mb-8">
        <img
          className="card__image w-full h-full object-cover rounded-2xl"
          src={imageSrc}
          alt={`${title}`}
        />
      </div>

      <div className="card__content flex flex-col gap-8">
        <div className="card__text space-y-1">
          <h2 className="card__title text-2xl font-semibold text-bluedot-darker">{title}</h2>
          {subtitle && (<p className="card__subtitle text-base text-black">{subtitle}</p>)}
        </div>

        <CTALinkOrButton
          url={ctaUrl}
          variant="secondary"
          withChevron={false}
        >
          LinkedIn
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export default Card;
