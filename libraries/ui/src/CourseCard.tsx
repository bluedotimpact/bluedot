import React from 'react';
import clsx from 'clsx';
import { Card } from './Card';
import { CTALinkOrButton } from './CTALinkOrButton';
import { Tag } from './Tag';

export type CourseCardProps = React.PropsWithChildren<{
  title: string,
  description: string,
  imageSrc: string,
  className?: string,
  ctaUrl?: string,
  applicationDeadline?: string, // Expected format: "Feb 1"
  // eslint-disable-next-line react/no-unused-prop-types
  cardType?: 'Featured' | 'Regular',
  // eslint-disable-next-line react/no-unused-prop-types
  courseType?: CourseType,
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

const FeaturedCourseCard: React.FC<CourseCardProps> = ({
  className,
  title,
  description,
  ctaUrl,
  applicationDeadline,
  imageSrc,
  children,
}) => {
  const wrapperClassName = clsx(
    'course-card course-card--featured card flex flex-col items-start transition-transform duration-200 hover:scale-[1.01] hover:container-elevated',
    'container-lined p-6 max-w-[656px]',
    className,
  );

  return (
    <a
      href={ctaUrl}
      className={wrapperClassName}
    >
      <div className="course-card__content flex gap-space-between">
        <div className="course-card__text">
          <p className="course-card__featured-label uppercase font-[650] text-xs mb-3">
            Featured course
          </p>
          <h3 className="course-card__title mb-6">
            {title}
          </h3>
          <CTALinkOrButton
            className="course-card__cta mb-6 px-6"
            variant="primary"
            withChevron={false}
          >
            {applyByText(applicationDeadline)}
          </CTALinkOrButton>
          {description && (
            <p className="course-card__subtitle text-sm overflow-hidden text-bluedot-black text-ellipsis mb-6">
              {description}
            </p>
          )}
        </div>
        <div className="course-card__image-container flex-shrink-0 max-w-[60%] mb-6">
          <img
            className="course-card__image w-[319px] h-full object-cover"
            src={imageSrc}
            alt={`${title}`}
          />
        </div>
      </div>
      {children}
    </a>
  );
};

export const CourseCard: React.FC<CourseCardProps> = ({
  className,
  title,
  description,
  ctaUrl,
  applicationDeadline,
  cardType = 'Regular',
  courseType = 'Crash course',
  imageSrc,
}) => {
  const CourseCardFooter = (
    <div className="course-card__footer flex justify-between w-full">
      <p className="course-card__footer-left text-left text-xs text-bluedot-black">
        <span className="course-card__length font-medium">{courseLength(courseType)}</span>
      </p>
      <Tag className="course-card__type">{courseType}</Tag>
    </div>
  );

  return cardType === 'Featured' ? (
    <div className="p-[3px]">
      <FeaturedCourseCard
        className={className}
        title={title}
        description={description}
        ctaUrl={ctaUrl}
        applicationDeadline={applicationDeadline}
        imageSrc={imageSrc}
      >
        {CourseCardFooter}
      </FeaturedCourseCard>
    </div>
  ) : (
    <div className="p-[2px]">
      <Card
        imageSrc={imageSrc}
        title={title}
        subtitle={description}
        ctaUrl={ctaUrl}
        isEntireCardClickable
        isExternalUrl
        className={clsx(
          'course-card course-card--regular container-lined p-5',
          'flex flex-col w-[323px] h-[466px] hover:container-elevated',
          className,
        )}
        imageClassName="course-card__image w-full h-[165px] object-cover rounded-none"
        subtitleClassName="flex-grow overflow-hidden text-ellipsis line-clamp-4 max-h-[96px]"
      >
        {CourseCardFooter}
      </Card>
    </div>
  );
};
