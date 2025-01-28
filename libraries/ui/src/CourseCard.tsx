import React from 'react';
import clsx from 'clsx';
import { Tag } from './Tag';

export type CourseCardProps = React.PropsWithChildren<{
  // Required
  title: string,
  description: string,
  // Optional
  className?: string,
  applicationDeadline?: string, // Expected format: "Feb 1"
  cardType?: 'Featured' | 'Regular',
  courseType?: CourseType,
  imageSrc?: string
}>;

type CourseType = 'Crash course' | 'Self-paced' | 'In-depth course';

const courseLength = (courseType: CourseType) => {
  switch (courseType) {
    case 'Crash course':
      return '5 days';
    case 'Self-paced':
      return '12 weeks';
    case 'In-depth course':
      return '12 weeks';
    default:
      throw new Error(`Invalid course type: ${courseType satisfies never}`);
  }
};

const applyByText = (applicationDeadline: string | undefined) => {
  return applicationDeadline ? `Apply by ${applicationDeadline}` : 'Apply now';
};

export const CourseCard: React.FC<CourseCardProps> = ({
  children,
  className,
  title,
  description,
  applicationDeadline,
  cardType = 'Regular',
  courseType = 'Crash course',
  imageSrc,
}) => {
  return (
    cardType === 'Featured'
      ? (
        <div data-testid="course-card--featured" className={clsx('container-lined px-8 pb-4 max-w-[646px]', className)}>
          <p data-testid="course-card__featured-label" className="uppercase font-semibold">Featured course</p>
          <img
            src={imageSrc}
            alt="Course Card Placeholder"
            data-testid="course-card__image"
            className="w-full h-[165px] object-cover rounded-lg"
          />
          <h3 data-testid="course-card__title" className="text-bluedot-normal text-[24px] mb-4 font-serif font-extrabold leading-none">{title}</h3>
          <p data-testid="course-card__description" className="text-bluedot-darker text-md mb-4 line-clamp-6">{description}</p>
          <div data-testid="course-card__metadata" className="flex justify-between items-center">
            <p data-testid="course-card__metadata-item" className="text-left text-xs">
              {courseLength(courseType)}
            </p>
            <Tag dataTestId="course-card__application-deadline">
              {applyByText(applicationDeadline)}
            </Tag>
          </div>
          {children}
        </div>
      )
      : (
        <div data-testid="course-card" className={clsx('container-lined px-6 pb-6 max-w-[323px]', className)}>
          <img
            src={imageSrc}
            alt="Course Card Placeholder"
            data-testid="course-card__image"
            className="w-full h-[165px] object-cover rounded-xl mt-6 mb-12"
          />
          <h3 data-testid="course-card__title" className="text-bluedot-normal text-[24px] mb-4 font-serif font-extrabold leading-none">{title}</h3>
          <p data-testid="course-card__description" className="text-bluedot-darker text-md mb-4 line-clamp-4">{description}</p>
          <div data-testid="course-card__metadata" className="flex justify-between items-center">
            <p data-testid="course-card__metadata-item" className="text-left text-xs">
              {courseLength(courseType)}
            </p>
            <Tag dataTestId="course-card__application-deadline">
              {applyByText(applicationDeadline)}
            </Tag>
          </div>
          {children}
        </div>
      )
  );
};
