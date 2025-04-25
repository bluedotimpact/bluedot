import React from 'react';
import clsx from 'clsx';
import { Tag } from '@bluedot/ui';
import { H3, P } from '../Text';

export type CourseSearchCardProps = React.PropsWithChildren<{
  // Required
  title: string,
  url: string,
  // Optional
  className?: string,
  description?: string,
  duration?: string,
  imageSrc?: string,
}>;

export const CourseSearchCard: React.FC<CourseSearchCardProps> = ({
  children,
  className,
  description,
  duration,
  imageSrc,
  title,
  url,
}) => {
  const defaultImageSrc = '/images/courses/default.jpg';

  return (
    <a
      href={url}
      className={clsx(
        'course-search-card flex flex-col md:flex-row gap-6 container-lined p-6 max-w-[828px] size-full md:max-h-[320px] transition-transform duration-200 hover:scale-[1.01] hover:container-elevated',
        className,
      )}
    >
      <div className="course-search-card__image-container h-[240px] w-full md:w-fit">
        <img className="course-search-card__image size-full object-cover rounded-lg" src={imageSrc || defaultImageSrc} alt={title} />
      </div>
      <div className="course-search-card__content flex flex-col gap-4 flex-1">
        <div className="course-search-card__text">
          <H3 className="course-search-card__title mb-6">
            {title}
          </H3>
          {description && (
            <P className="course-search-card__description text-sm overflow-hidden text-bluedot-black text-ellipsis mb-6">
              {description}
            </P>
          )}
          {duration && (
            <Tag className="course-search-card__duration">{duration}</Tag>
          )}
        </div>
      </div>
      {children}
    </a>
  );
};
