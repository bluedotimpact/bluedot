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
}>;

export const CourseSearchCard: React.FC<CourseSearchCardProps> = ({
  children,
  className,
  description,
  duration,
  title,
  url,
}) => {
  return (
    <a
      href={url}
      className={clsx(
        'course-search-card flex flex-row container-lined p-6 transition-transform duration-200 hover:scale-[1.01] hover:container-elevated',
        className,
      )}
    >
      <div className="course-search-card__content block md:flex gap-space-between w-full">
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
            <Tag>{duration}</Tag>
          )}
        </div>
      </div>
      {children}
    </a>
  );
};
