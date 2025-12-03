import React from 'react';
import clsx from 'clsx';
import { Card } from './Card';
import { CTALinkOrButton } from './CTALinkOrButton';
import { ClickTarget } from './ClickTarget';

export type CourseCardProps = React.PropsWithChildren<{
  title: string,
  description?: string,
  imageSrc?: string,
  url: string,
  className?: string,
  applicationDeadline?: string, // Expected format: "Feb 1"
  // eslint-disable-next-line react/no-unused-prop-types
  cardType?: 'Featured' | 'Regular',
  // eslint-disable-next-line react/no-unused-prop-types
  cadence: string,
  // eslint-disable-next-line react/no-unused-prop-types
  courseLength: string, // Expected format: "5 days"
  imageClassName?: string,
}>;

const applyByText = (applicationDeadline: string | undefined) => {
  return applicationDeadline ? `Apply by ${applicationDeadline}` : 'Apply now';
};

const FeaturedCourseCard: React.FC<CourseCardProps> = ({
  className,
  title,
  description,
  url,
  applicationDeadline,
  imageSrc,
  imageClassName,
  children,
}) => {
  const wrapperClassName = clsx(
    // m-[3px] is here to allow the card to expand on hover
    'flex flex-col items-start justify-between m-[3px]',
    'container-lined p-6 max-w-[700px] transition-transform duration-200 hover:scale-[1.01] hover:container-elevated',
    className,
  );

  return (
    <ClickTarget
      url={url}
      className={wrapperClassName}
    >
      <div className="flex flex-col gap-4 md:flex-row md:gap-space-between w-full">
        <div className="flex flex-col">
          <h3 className="mb-6 bluedot-h3">
            {title}
          </h3>
          {description && (
            <p className="overflow-hidden text-bluedot-black text-ellipsis mb-6 bluedot-p flex-grow">
              {description}
            </p>
          )}
          <CTALinkOrButton
            className="px-6 mt-auto bg-bluedot-normal text-white hover:bg-[#1a3399] focus:bg-[#1a3399] transition-colors duration-200"
            withChevron={false}
          >
            {applyByText(applicationDeadline)}
          </CTALinkOrButton>
        </div>
        {imageSrc && (
        <div className={clsx('shrink-0 md:max-w-[60%] w-fit flex items-stretch', imageClassName)}>
          <img
            className="size-full object-cover"
            src={imageSrc}
            alt=""
          />
        </div>
        )}
      </div>
      {children}
    </ClickTarget>
  );
};

export const CourseCard: React.FC<CourseCardProps> = ({
  className,
  title,
  description,
  url,
  applicationDeadline,
  cardType = 'Regular',
  cadence,
  courseLength,
  imageSrc,
  imageClassName,
}) => {
  // Footer with course duration and cadence removed per user request

  return cardType === 'Featured' ? (
    <FeaturedCourseCard
      className={className}
      title={title}
      description={description}
      url={url}
      applicationDeadline={applicationDeadline}
      imageSrc={imageSrc}
      imageClassName={imageClassName}
      cadence={cadence}
      courseLength={courseLength}
    />
  ) : (
    <div className="p-[3px] h-full">
      <Card
        imageSrc={imageSrc}
        title={title}
        subtitle={description}
        ctaUrl={url}
        isEntireCardClickable
        className={clsx(
          'container-lined p-5',
          'flex flex-col max-w-full h-full hover:container-elevated',
          className,
        )}
        imageClassName="w-full h-[165px] object-cover rounded-none"
        subtitleClassName="grow overflow-hidden text-ellipsis line-clamp-4 max-h-[96px]"
      />
    </div>
  );
};
