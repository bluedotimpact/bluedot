import React from 'react';

interface ValueCardProps {
  icon: string;
  title?: string;
  description: string;
}

export const ValueCard: React.FC<ValueCardProps> = ({ icon, title, description }) => {
  return (
    <div className="value-card w-full flex flex-col gap-6 py-6">
      <div className="value-card__icon-wrapper size-[50px] flex items-center justify-center">
        <img
          src={icon}
          alt={title}
          className="value-card__icon"
        />
      </div>
      {title && (
        <h3 className="value-card__title min-h-[60px]">
          {title}
        </h3>
      )}
      <p className={`value-card__description ${title ? '' : 'font-semibold'}`}>
        {description}
      </p>
    </div>
  );
};

export default ValueCard;
