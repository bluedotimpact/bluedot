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

// TODO Are these really the different course lengths
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

interface FeaturedCardProps {
  imageSrc: string;
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaUrl?: string;
  isEntireCardClickable?: boolean;
  isExternalUrl?: boolean;
  className?: string;
  courseType: CourseType;
}

const FeaturedCard: React.FC<FeaturedCardProps> = ({
  imageSrc,
  title,
  subtitle,
  ctaUrl,
  ctaText,
  isEntireCardClickable = false,
  isExternalUrl = false,
  className = '',
  courseType,
}) => {
  const Wrapper = isEntireCardClickable && ctaUrl ? 'a' : 'div';
  const wrapperClassName = clsx(
    'card flex flex-col items-start transition-transform duration-200',
    isEntireCardClickable && 'hover:scale-[1.01]',
    className,
  );

  // TODO class names
  return (
    <Wrapper
      href={isEntireCardClickable ? ctaUrl : undefined}
      {...(isEntireCardClickable &&
        isExternalUrl &&
        ctaUrl &&
        EXTERNAL_LINK_PROPS)}
      className={wrapperClassName}
    >
      <div className="flex gap-4">
        <div className="card__content flex flex-col gap-4 w-full flex-1 justify-between">
          <div className="card__text">
            <p className="course-card__featured-label uppercase font-[650] text-xs mb-3">
              Featured course
            </p>
            <h2 className="card__title text-xxl font-semibold text-bluedot-darker mb-6">
              {title}
            </h2>
            <CTALinkOrButton
              className="card__cta mb-6 px-6"
              url={!isEntireCardClickable ? ctaUrl : undefined}
              variant="primary"
              withChevron={false}
              isExternalUrl={isExternalUrl}
            >
              {ctaText}
            </CTALinkOrButton>
            {subtitle && (
              <p className="card__subtitle text-sm overflow-hidden text-bluedot-black text-ellipsis mb-6">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="card__image-container flex-shrink-0 max-w-[60%] mb-6">
          <img
            className={`card__image w-[319px] h-full object-cover`}
            src={imageSrc}
            alt={`${title}`}
          />
        </div>
      </div>

      <div className="card__tag flex justify-between w-full">
        <p className="card__cta-metadata text-left text-xs text-bluedot-black">
          <span className="flex gap-[3px] items-center font-[650]">
            5.0{" "}
            <img
              src="/icons/star.svg"
              alt="→"
              className="cta-button__chevron-icon size-2"
            />
          </span>
          <span className="font-medium">{courseLength(courseType)}</span>
        </p>
        <Tag>{courseType}</Tag>
      </div>
    </Wrapper>
  );
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
        <FeaturedCard
          imageSrc={imageSrc}
          title={title}
          subtitle={description}
          ctaUrl={ctaUrl}
          ctaText={applyByText(applicationDeadline)}
          isEntireCardClickable
          isExternalUrl
          className={clsx('course-card container-lined p-6 max-w-[656px]', className)}
          courseType={courseType}
        />
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
