import React from 'react';
import clsx from 'clsx';
import { LinkOrButton, LinkOrButtonProps } from './legacy/LinkOrButton';
import { Tag } from './Tag';

export type CourseCardProps = React.PropsWithChildren<{
  className?: string,
  title: string,
  description: string,
  courseType: CourseType,
  cardType?: 'Featured' | 'Regular',
  image?: string
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

export const CourseCard: React.FC<CourseCardProps> = ({
  children, className, title, description, courseType = 'Crash course', cardType = 'Regular', image,
}) => {
  return (
    cardType === 'Featured'
      ? (
        <div className={clsx('border border-gray-300 rounded-lg px-8 pb-4 max-w-[323px]', className)}>
          <p className="uppercase font-semibold">Featured course</p>
          <img src={image} alt="Course Card Placeholder" className="w-full h-[165px] object-cover rounded-lg" />
          <h3 className="text-bluedot-normal text-[24px] mb-4 font-serif font-extrabold leading-none">{title}</h3>
          <p className="text-bluedot-darker text-md mb-4 line-clamp-6">{description}</p>
          <div className="flex justify-between items-center">
            <p className="text-left text-xs">
              {courseLength(courseType)}
            </p>
            <Tag
              label={courseType}
            />
          </div>
          {children}
        </div>
      )
      : (
        <div className={clsx('border border-gray-300 rounded-xl px-6 pb-6 max-w-[323px]', className)}>
          <img src={image} alt="Course Card Placeholder" className="w-full h-[165px] object-cover rounded-xl mt-6 mb-12" />
          <h3 className="text-bluedot-normal text-[24px] mb-4 font-serif font-extrabold leading-none">{title}</h3>
          <p className="text-bluedot-darker text-md mb-4 line-clamp-4">{description}</p>
          <div className="flex justify-between items-center">
            <p className="text-left text-xs">
              {courseLength(courseType)}
            </p>
            <Tag
              label={courseType}
            />
          </div>
          {children}
        </div>
      )
  );
};

export const CourseCardButton: React.FC<LinkOrButtonProps> = ({ className, ...rest }) => {
  return (
    <LinkOrButton className={clsx('border border-neutral-500 rounded px-8 pb-4 text-bluedot-black transition-all duration-200 inline-block cursor-pointer data-[hovered]:border-bluedot-normal data-[hovered]:bg-bluedot-lighter data-[focus-visible]:border-bluedot-normal data-[focus-visible]:bg-bluedot-lighter data-[pressed]:border-bluedot-normal data-[pressed=true]:bg-bluedot-normal data-[pressed=true]:text-white outline-none [text-align:inherit]', className)} {...rest} />
  );
};
