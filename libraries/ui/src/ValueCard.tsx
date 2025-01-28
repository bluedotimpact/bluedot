import React from 'react';

interface ValueCardProps {
  icon: string;
  title: string;
  description: string;
}

export const ValueCard: React.FC<ValueCardProps> = ({ icon, title, description }) => {
  return (
    <div className="value-card container-lined w-[437px] h-[296px] p-6 flex flex-col gap-[27px]">
      <div className="value-card__icon-wrapper w-[50px] h-[50px] flex items-center justify-center">
        <img
          src={icon}
          alt={title}
          className="value-card__icon"
        />
      </div>
      <h3 className="value-card__title font-reckless text-2xl font-[450] leading-[26.9px] text-left text-bluedot-normal">
        {title}
      </h3>
      <p className="value-card__description font-roobert text-base font-normal leading-[20.22px] text-left">
        {description}
      </p>
    </div>
  );
};

export default ValueCard;
