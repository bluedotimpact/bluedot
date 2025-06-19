import React from 'react';
import clsx from 'clsx';
import { ClickTarget, Tag } from '@bluedot/ui';
import { FaStar } from 'react-icons/fa6';
import { H3, P } from '../Text';

export type CourseSearchCardProps = React.PropsWithChildren<{
  // Required
  title: string,
  url: string,
  // Optional
  className?: string,
  description?: string,
  cadence?: string,
  level?: string,
  averageRating?: number | null;
  imageSrc?: string,
}>;

const displayAverageRating = (rating?: number | null) => (rating ? rating.toFixed(1) : '');

export const CourseSearchCard: React.FC<CourseSearchCardProps> = ({
  children,
  className,
  description,
  cadence,
  level,
  averageRating,
  imageSrc,
  title,
  url,
}) => {
  const defaultImageSrc = '/images/courses/default.jpg';

  return (
    <ClickTarget
      url={url}
      className={clsx(
        'course-search-card flex flex-col gap-6 container-lined p-6 max-w-[828px] size-full transition-transform duration-200 hover:scale-[1.01] hover:container-elevated',
        className,
      )}
    >
      <div className="course-search-card__image-container h-[200px] w-full">
        <img className="course-search-card__image size-full object-cover rounded-lg" src={imageSrc || defaultImageSrc} alt={title} />
      </div>
      <div className="course-search-card__content flex flex-col justify-between gap-space-between flex-1">
        <div className="course-search-card__text">
          <H3 className="course-search-card__title mb-4">
            {title}
          </H3>
          {description && (
            <P className="course-search-card__description overflow-hidden text-bluedot-black text-ellipsis mb-4">
              {description}
            </P>
          )}
        </div>
        <div className="course-search-card__footer flex flex-wrap gap-4">
          <div className="flex gap-2">
            {level && (
              <Tag className="course-search-card__level">{level}</Tag>
            )}
            {cadence && (
              <Tag className="course-search-card__duration">{cadence}</Tag>
            )}
          </div>
          {typeof averageRating === 'number' && (
            <div className="course-card__footer-left ml-auto text-size-xs text-bluedot-black gap-1 flex flex-col items-end justify-end">
              <span className="course-card__rating flex gap-[3px] items-start font-bold pb-2">
                {displayAverageRating(averageRating)}{' '}
                <FaStar className="mt-px" />
              </span>
            </div>
          )}
        </div>
      </div>
      {children}
    </ClickTarget>
  );
};
