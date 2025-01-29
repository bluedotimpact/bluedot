import React from 'react';
import clsx from 'clsx';
import { Tag } from './Tag';
import { Card } from './Card';

export type CourseCardProps = React.PropsWithChildren<{
  // Required
  title: string,
  description: string,
  // Optional
  className?: string,
  ctaUrl?: string,
  applicationDeadline?: string, // Expected format: "Feb 1"
  cardType?: 'Featured' | 'Regular',
  courseType?: CourseType,
  imageSrc: string
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

export const applyByText = (applicationDeadline: string | undefined) => {
  return applicationDeadline ? `Apply by ${applicationDeadline}` : 'Apply now';
};

export const CourseCard: React.FC<CourseCardProps> = ({
  children,
  className,
  title,
  description,
  ctaUrl,
  applicationDeadline,
  cardType = 'Regular',
  courseType = 'Crash course',
  imageSrc,
}) => {
  return (
    cardType === 'Featured'
      ? (
        <div className={clsx('course-card--featured container-lined px-8 pb-4 max-w-[646px]', className)}>
          <p className="course-card__featured-label uppercase font-semibold">Featured course</p>
          <img
            src={imageSrc}
            alt="Course Card Placeholder"
            className="course-card__image w-full h-[165px] object-cover rounded-lg"
          />
          <h3 className="course-card__title text-bluedot-normal text-[24px] mb-4 font-serif font-extrabold leading-none">{title}</h3>
          <p className="course-card__description text-bluedot-darker text-md mb-4 line-clamp-6">{description}</p>
          <div className="course-card__metadata flex justify-between items-center">
            <p className="course-card__metadata-item text-left text-xs">
              {courseLength(courseType)}
            </p>
            <Tag className="course-card__application-deadline">
              {applyByText(applicationDeadline)}
            </Tag>
          </div>
          {children}
        </div>
      )
      : (
        <Card
          imageSrc={imageSrc}
          title={title}
          subtitle={description}
          ctaMetadata={courseLength(courseType)}
          ctaUrl={ctaUrl}
          ctaText={applyByText(applicationDeadline)}
          isEntireCardClickable
          isExternalUrl
          className={clsx('course-card container-lined p-5 max-w-[323px]', className)}
          imageClassName="course-card__image w-full h-[165px] object-cover rounded-xl"
        />
      )
  );
};
