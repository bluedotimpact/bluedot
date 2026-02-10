import type React from 'react';
import clsx from 'clsx';
import { ClickTarget, H3, P } from '@bluedot/ui';
import { FaStar } from 'react-icons/fa6';

export type CourseSearchCardProps = React.PropsWithChildren<{
  // Required
  title: string;
  url: string;
  // Optional
  className?: string;
  description?: string;
  averageRating?: number | null;
  imageSrc?: string;
}>;

const displayAverageRating = (rating?: number | null) => (rating ? rating.toFixed(1) : '');

export const CourseSearchCard: React.FC<CourseSearchCardProps> = ({
  children,
  className,
  description,
  averageRating,
  imageSrc,
  title,
  url,
}) => {
  const defaultImageSrc = '/images/courses/default.webp';

  return (
    <ClickTarget
      url={url}
      className={clsx(
        'flex flex-col container-lined p-6 max-w-[828px] size-full transition-transform duration-200 hover:scale-[1.01] hover:container-elevated',
        className,
      )}
    >
      <div className="h-[200px] w-full mb-4">
        <img className="size-full object-cover rounded-lg" src={imageSrc || defaultImageSrc} alt={title} />
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex-1">
          <H3 className="mb-3">
            {title}
          </H3>
          {description && (
            <P className="text-bluedot-black">
              {description}
            </P>
          )}
        </div>
        {typeof averageRating === 'number' && (
          <div className="flex justify-end mt-4">
            <div className="text-size-xs text-bluedot-black gap-1 flex flex-col items-end">
              <span className="flex gap-[3px] items-start font-bold">
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
