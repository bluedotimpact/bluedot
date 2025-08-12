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
  courseLength?: string,
  averageRating?: number | null;
  imageSrc?: string,
}>;

const displayAverageRating = (rating?: number | null) => (rating ? rating.toFixed(1) : '');

export const CourseSearchCard: React.FC<CourseSearchCardProps> = ({
  children,
  className,
  description,
  cadence,
  courseLength,
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
        'course-search-card flex flex-col container-lined p-6 max-w-[828px] size-full transition-transform duration-200 hover:scale-[1.01] hover:container-elevated',
        className,
      )}
    >
      <div className="course-search-card__image-container h-[200px] w-full mb-4">
        <img className="course-search-card__image size-full object-cover rounded-lg" src={imageSrc || defaultImageSrc} alt={title} />
      </div>
      <div className="course-search-card__content flex flex-col flex-1">
        <div className="course-search-card__text flex-1">
          <H3 className="course-search-card__title mb-3">
            {title}
          </H3>
          {description && (
            <P className="course-search-card__description text-bluedot-black">
              {description}
            </P>
          )}
        </div>
        {typeof averageRating === 'number' && (
          <div className="course-search-card__footer flex justify-end mt-4">
            <div className="course-card__footer-left text-size-xs text-bluedot-black gap-1 flex flex-col items-end">
              <span className="course-card__rating flex gap-[3px] items-start font-bold">
                {displayAverageRating(averageRating)}{' '}
                <FaStar className="mt-px" />
              </span>
            </div>
          </div>
        )}
      </div>
      {children}
    </ClickTarget>
  );
};
