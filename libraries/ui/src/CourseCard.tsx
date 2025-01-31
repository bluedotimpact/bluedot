import React from 'react';
import clsx from 'clsx';
import { Card } from './Card';
import { EXTERNAL_LINK_PROPS } from './utils';
import { CTALinkOrButton } from './CTALinkOrButton';
import { Tag } from './Tag';

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

const applyByText = (applicationDeadline: string | undefined) => {
  return applicationDeadline ? `Apply by ${applicationDeadline}` : 'Apply now';
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
  const footerRow = (
    <div className="course-card__footer flex justify-between w-full">
      <p className="course-card__footer-left text-left text-xs text-bluedot-black">
        <span className="course-card__rating flex gap-[3px] items-center font-[650]">
          5.0{' '}
          <img
            src="/icons/star.svg"
            alt="★"
            className="course-card__star-icon size-[10px]"
          />
        </span>
        <span className="course-card__length font-medium">{courseLength(courseType)}</span>
      </p>
      <Tag className="course-card__type">{courseType}</Tag>
    </div>
  );

  if (cardType === 'Featured') {
    const wrapperClassName = clsx(
      'course-card course-card--featured card flex flex-col items-start transition-transform duration-200 hover:scale-[1.01]',
      'container-lined p-6 max-w-[656px]',
      className,
    );

    return (
      <a
        href={ctaUrl}
        {...EXTERNAL_LINK_PROPS}
        className={wrapperClassName}
      >
        <div className="course-card__content flex gap-4">
          <div className="course-card__text">
            <p className="course-card__featured-label uppercase font-[650] text-xs mb-3">
              Featured course
            </p>
            <h2 className="course-card__title text-xxl font-semibold text-bluedot-darker mb-6">
              {title}
            </h2>
            <CTALinkOrButton
              className="course-card__cta mb-6 px-6"
              variant="primary"
              withChevron={false}
              isExternalUrl
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
        {footerRow}
      </a>
    );
  }

  return (
    <Card
      imageSrc={imageSrc}
      title={title}
      subtitle={description}
      footerContent={footerRow}
      ctaUrl={ctaUrl}
      ctaText={applyByText(applicationDeadline)}
      isEntireCardClickable
      isExternalUrl
      className={clsx('course-card course-card--regular container-lined p-5 max-w-[323px]', className)}
      imageClassName="course-card__image w-full h-[165px] object-cover rounded-none"
    />
  );
};
