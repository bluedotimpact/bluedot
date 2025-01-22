import React from 'react';
import { CTALink } from './CTALink';

interface CardProps {
  imageSrc: string;
  name: string;
  role: string;
  linkedInUrl: string;
}

export const CardGeneric: React.FC<CardProps> = ({
  imageSrc,
  name,
  role,
  linkedInUrl,
}) => {
  return (
    <div className="card w-80 h-80 flex flex-col items-start">
      <div className="card__image-container w-full h-48 mb-8">
        <img
          className="card__image w-full h-full object-cover rounded-2xl"
          src={imageSrc}
          alt={`${name}`}
        />
      </div>

      <div className="card__content flex flex-col gap-8">
        <div className="card__text space-y-1">
          <h2 className="card__name text-2xl font-semibold text-bluedot-darker">{name}</h2>
          <p className="card__role text-base text-black">{role}</p>
        </div>

        <CTALink
          href={linkedInUrl}
          variant="secondary"
          withChevron={false}
        >
          LinkedIn
        </CTALink>
      </div>
    </div>
  );
};

export default CardGeneric;
