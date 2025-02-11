import clsx from 'clsx';
import React from 'react';

interface ValueCardProps {
  icon: string;
  description: string;
  title?: string;
  dark?: boolean;
  className?: string;
}

export const ValueCard: React.FC<ValueCardProps> = ({
  icon, title, description, dark = false, className,
}) => {
  return (
    <div
      className={clsx(
        'value-card size-full flex flex-col gap-6 py-6 rounded-radius-md',
        dark ? 'bg-color-canvas-dark [&_*]:text-white px-6' : 'bg-color-canvas',
        className,
      )}
    >
      <div
        className={clsx(
          'value-card__icon-wrapper flex items-center',
          dark ? 'flex-1 ml-[10%]' : 'justify-center size-[50px]',
        )}
      >
        <img src={icon} alt={title} className="value-card__icon" />
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
