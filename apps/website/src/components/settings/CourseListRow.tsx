import { useState } from 'react';
import { CTALinkOrButton, addQueryParam } from '@bluedot/ui';
import { FaCheck } from 'react-icons/fa6';
import { courseTable, courseRegistrationTable } from '@bluedot/db';
import CourseDetails from './CourseDetails';
import { ROUTES } from '../../lib/routes';

type CourseListRowProps = {
  course: typeof courseTable.pg.$inferSelect;
  courseRegistration: typeof courseRegistrationTable.pg.$inferSelect;
  isFirst?: boolean;
  isLast?: boolean;
};

const CourseListRow = ({
  course, courseRegistration, isFirst = false, isLast = false,
}: CourseListRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompleted = !!courseRegistration.certificateCreatedAt;

  // Mock progress percentage for in-progress courses
  // const progressPercentage = isCompleted ? 100 : Math.floor(Math.random() * 80) + 10;

  // Format completion date
  const metadataText = isCompleted && courseRegistration.certificateCreatedAt
    ? `Completed on ${new Date(courseRegistration.certificateCreatedAt * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`
    : ''; // Removed "In progress" text

  return (
    <div>
      <div className={`border-x border-t ${isLast && !isExpanded ? 'border-b' : ''} ${isFirst ? 'rounded-t-xl' : ''} ${isLast && !isExpanded ? 'rounded-b-xl' : ''} border-gray-200 ${isExpanded ? 'bg-white' : 'hover:bg-white'} transition-colors duration-200 group`}>
        <div className="p-4 sm:px-8 sm:py-6">
          {/* Mobile layout */}
          <div className="flex flex-col gap-4 sm:hidden">
            {/* Top row: Title and Expand button */}
            <div className="flex items-start gap-3">
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[15px] text-[#00114D] leading-[22px]">{course.title}</h3>
                {metadataText && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-size-xs font-medium text-[#00114D] opacity-50 leading-4">
                      {metadataText}
                    </p>
                    {isCompleted && (
                      <span className="inline-flex items-center justify-center size-3.5 bg-[#8088A6] rounded-full">
                        <FaCheck className="size-1.5 text-white" />
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Expand/collapse button - always visible */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="size-9 flex items-center justify-center hover:bg-gray-100 rounded-md transition-all duration-150 flex-shrink-0"
                aria-label={isExpanded ? `Collapse ${course.title} details` : `Expand ${course.title} details`}
                aria-expanded={isExpanded}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                >
                  <path
                    d="M7.5 5L12.5 10L7.5 15"
                    stroke="#00114D"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Bottom row: Action button */}
            <div className="flex">
              <CTALinkOrButton
                variant={isCompleted ? 'black' : 'outline-black'}
                size="small"
                url={isCompleted && courseRegistration.certificateId
                  ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
                  : course.path}
                className="w-full"
              >
                {isCompleted ? 'View your certificate' : 'Continue course'}
              </CTALinkOrButton>
            </div>
          </div>

          {/* Desktop layout - original design */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[15px] text-[#00114D] leading-[22px]">{course.title}</h3>
              {metadataText && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-size-xs font-medium text-[#00114D] opacity-50 leading-4">
                    {metadataText}
                  </p>
                  {isCompleted && (
                    <span className="inline-flex items-center justify-center size-3.5 bg-[#8088A6] rounded-full">
                      <FaCheck className="size-1.5 text-white" />
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Continue/View course/View certificate button */}
              <CTALinkOrButton
                variant={isCompleted ? 'black' : 'outline-black'}
                size="small"
                url={isCompleted && courseRegistration.certificateId
                  ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
                  : course.path}
              >
                {isCompleted ? 'View your certificate' : 'Continue course'}
              </CTALinkOrButton>

              {/* Expand/collapse button */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="size-9 flex items-center justify-center hover:bg-gray-100 rounded-md transition-all duration-150"
                aria-label={isExpanded ? `Collapse ${course.title} details` : `Expand ${course.title} details`}
                aria-expanded={isExpanded}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                >
                  <path
                    d="M7.5 5L12.5 10L7.5 15"
                    stroke="#00114D"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <CourseDetails
          course={course}
          isLast={isLast}
        />
      )}
    </div>
  );
};

export default CourseListRow;
