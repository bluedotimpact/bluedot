import type React from 'react';
import clsx from 'clsx';
import { Tag } from './Tag';
import { ClickTarget } from './ClickTarget';

export type UnitCardProps = {
  // Required
  title: string;
  unitNumber: string;
  url: string;
  // Optional
  className?: string;
  description?: string;
  duration?: number;
  isCurrentUnit?: boolean;
};

export const UnitCard: React.FC<UnitCardProps> = ({
  className,
  description,
  duration,
  isCurrentUnit,
  title,
  unitNumber,
  url,
}) => {
  return (
    <ClickTarget
      url={url}
      className={clsx(
        'unit-card p-4 flex flex-col gap-2 justify-between',
        className,
        isCurrentUnit ? 'unit-card--active border-color-primary' : 'border-color-divider',
        'border rounded-lg hover:bg-bluedot-lightest hover:border-color-primary',
      )}
    >
      <div className="unit-card__item flex flex-col gap-2">
        <p className="unit-card__number uppercase text-size-xs font-bold">Unit {unitNumber}</p>
        <p className="unit-card__title text-color-secondary-text text-size-md font-[650]">{title}</p>
        <p className="unit-card__description">{description}</p>
      </div>
      {duration && (
        <div className="unit-card__metadata flex flex-row justify-between items-end">
          <Tag>{duration} mins</Tag>
        </div>
      )}
    </ClickTarget>
  );
};
