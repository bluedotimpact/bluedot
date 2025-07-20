import { FaRegClock } from 'react-icons/fa6';
import { courseTable } from '@bluedot/db';
import MarkdownExtendedRenderer from '../courses/MarkdownExtendedRenderer';

type CourseDetailsProps = {
  course: typeof courseTable.pg.$inferSelect;
  isLast?: boolean;
};

const CourseDetails = ({ course, isLast = false }: CourseDetailsProps) => {
  return (
    <div className={`bg-white border-x border-b border-gray-200 ${isLast ? 'rounded-b-xl' : ''}`} role="region" aria-label={`Expanded details for ${course.title}`}>
      <div>
        {/* Tab navigation - keeping for future expansion */}
        <nav className="flex flex-col items-start px-8 border-b border-[#CCCCCC] mb-6" style={{ borderBottomWidth: '0.5px' }} aria-label="Course content tabs">
          <div className="flex items-start gap-5 h-9">
            <button
              type="button"
              className="flex flex-col items-center justify-between h-9 relative"
              aria-current="page"
              role="tab"
              aria-selected="true"
            >
              <span className="text-[13px] font-semibold leading-[22px] text-[#0037FF] flex items-center pt-1">
                Overview
              </span>
              <div className="w-full h-[2px] bg-[#0037FF]" />
            </button>
          </div>
        </nav>

        <div className="px-8 pb-6">
          {/* Two-column layout */}
          <div className="flex flex-row items-start gap-12">
            {/* Main content area */}
            <div className="flex-1 max-w-[520px]">
              {/* Course description */}
              <div>
                <h3 className="text-[13px] font-semibold text-[#00114D] mb-3">About this course</h3>
                <MarkdownExtendedRenderer className="text-[13px] leading-[150%] text-[#666C80] [&_p]:text-[13px] [&_p]:leading-[150%] [&_p]:text-[#666C80] [&_li]:text-[13px] [&_li]:leading-[150%] [&_li]:text-[#666C80]">
                  {course.description}
                </MarkdownExtendedRenderer>
              </div>
            </div>

            {/* Details sidebar */}
            <div className="w-[320px] flex-shrink-0">
              <div>
                <h3 className="text-[13px] font-semibold text-[#00114D] mb-3">Details</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FaRegClock className="size-4 text-[#00114D]" />
                    <span className="text-[13px] leading-[22px] text-[#00114D]">
                      Duration: {course.durationDescription}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
