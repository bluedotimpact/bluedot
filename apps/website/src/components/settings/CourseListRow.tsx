import { useState, useEffect } from 'react';
import { CTALinkOrButton, addQueryParam } from '@bluedot/ui';
import { FaCheck } from 'react-icons/fa6';
import { courseTable, courseRegistrationTable, meetPersonTable } from '@bluedot/db';
import useAxios from 'axios-hooks';
import CourseDetails from './CourseDetails';
import { ROUTES } from '../../lib/routes';
import { GetGroupDiscussionResponse, GroupDiscussion } from '../../pages/api/group-discussions/[id]';

type CourseListRowProps = {
  course: typeof courseTable.pg.$inferSelect;
  courseRegistration: typeof courseRegistrationTable.pg.$inferSelect;
  authToken?: string;
  isFirst?: boolean;
  isLast?: boolean;
};

const CourseListRow = ({
  course, courseRegistration, authToken, isFirst = false, isLast = false,
}: CourseListRowProps) => {
  const isCompleted = !!courseRegistration.certificateCreatedAt;
  const [isExpanded, setIsExpanded] = useState(false);
  const [expectedDiscussions, setExpectedDiscussions] = useState<GroupDiscussion[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch meetPerson data to get discussion IDs
  const [{ data: meetPersonData }] = useAxios<{ type: 'success'; meetPerson: typeof meetPersonTable.pg.$inferSelect | null }>({
    method: 'get',
    url: `/api/meet-person?courseRegistrationId=${courseRegistration.id}`,
    headers: authToken ? {
      Authorization: `Bearer ${authToken}`,
    } : undefined,
  }, {
    // Only fetch when not completed
    useCache: false,
    autoCancel: false,
  });

  // Fetch individual discussions when we have the meetPerson data
  useEffect(() => {
    const fetchDiscussions = async () => {
      if (!meetPersonData?.meetPerson || isCompleted) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Only fetch expected discussions for the list row
      const expectedPromises = (meetPersonData.meetPerson.expectedDiscussionsParticipant || []).map(async (id) => {
        try {
          const response = await fetch(`/api/group-discussions/${id}`);
          const data: GetGroupDiscussionResponse = await response.json();
          return data.discussion;
        } catch {
          return null;
        }
      });

      const expectedResults = await Promise.all(expectedPromises);

      // Filter out nulls and sort by startDateTime
      const validExpected = expectedResults.filter((d): d is GroupDiscussion => d !== null);
      validExpected.sort((a, b) => a.startDateTime - b.startDateTime);

      setExpectedDiscussions(validExpected);
      setLoading(false);
    };

    fetchDiscussions();
  }, [meetPersonData, isCompleted]);

  // Get current time in seconds
  const currentTimeSeconds = Math.floor(Date.now() / 1000);

  // Helper function to format time until discussion
  const formatTimeUntilDiscussion = (startDateTime: number): string => {
    const timeUntilStart = startDateTime - currentTimeSeconds;

    if (timeUntilStart <= 0) {
      return 'Discussion has started';
    }

    const days = Math.floor(timeUntilStart / (24 * 60 * 60));
    const hours = Math.floor((timeUntilStart % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeUntilStart % (60 * 60)) / 60);

    if (days > 0) {
      if (days === 1) {
        return '1 day';
      }
      return `${days} days`;
    }

    if (hours > 0 && minutes > 0) {
      return `${hours}hr ${minutes}min`;
    }
    if (hours > 0) {
      return `${hours}hr`;
    }
    if (minutes > 0) {
      return `${minutes}min`;
    }
    return 'Less than 1min';
  };

  // Get the next upcoming discussion from expectedDiscussions
  const upcomingDiscussions = expectedDiscussions.filter(
    (discussion) => discussion.endDateTime > currentTimeSeconds,
  );
  const nextDiscussion = upcomingDiscussions[0];

  // Determine button text and URL for next discussion
  const getDiscussionButtonInfo = () => {
    if (!nextDiscussion) return null;

    const oneHourInSeconds = 60 * 60;
    const timeUntilStart = nextDiscussion.startDateTime - currentTimeSeconds;
    const isStartingSoon = timeUntilStart < oneHourInSeconds && timeUntilStart > 0;

    const buttonText = isStartingSoon ? 'Join Discussion' : 'Prepare for discussion';
    let buttonUrl = '#';
    if (isStartingSoon) {
      buttonUrl = nextDiscussion.zoomLink || '#';
    } else if (course.slug && nextDiscussion.unitNumber) {
      buttonUrl = `/courses/${course.slug}/${nextDiscussion.unitNumber}`;
    }
    const openInNewTab = isStartingSoon;
    const disabled = !nextDiscussion.zoomLink && isStartingSoon;

    return {
      buttonText, buttonUrl, openInNewTab, disabled,
    };
  };

  const discussionButtonInfo = getDiscussionButtonInfo();

  // Format completion date
  const metadataText = isCompleted && courseRegistration.certificateCreatedAt
    ? `Completed on ${new Date(courseRegistration.certificateCreatedAt * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`
    : ''; // Removed "In progress" text

  // Determine hover class based on completion status
  const hoverClass = !isExpanded && !isCompleted ? 'hover:bg-white' : '';

  return (
    <div>
      <div className={`border-x border-t ${isLast && !isExpanded ? 'border-b' : ''} ${isFirst ? 'rounded-t-xl' : ''} ${isLast && !isExpanded ? 'rounded-b-xl' : ''} border-gray-200 ${isExpanded ? 'bg-white' : ''} ${hoverClass} transition-colors duration-200 group`}>
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
                {/* Show upcoming discussion info when collapsed */}
                {!isExpanded && !isCompleted && nextDiscussion && !loading && (
                  <p className="text-size-xs text-gray-600 mt-1">
                    Unit {nextDiscussion.unitNumber} starts in {formatTimeUntilDiscussion(nextDiscussion.startDateTime)}
                  </p>
                )}
              </div>

              {/* Expand/collapse button - only visible for in-progress courses */}
              {!isCompleted && (
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
              )}
            </div>

            {/* Bottom row: Action buttons */}
            {isCompleted && (
              <div className="flex">
                <CTALinkOrButton
                  variant="black"
                  size="small"
                  url={courseRegistration.certificateId
                    ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
                    : course.path}
                  className="w-full"
                >
                  View your certificate
                </CTALinkOrButton>
              </div>
            )}
            {/* Show primary button for discussion when collapsed on mobile */}
            {!isExpanded && !isCompleted && discussionButtonInfo && !loading && (
              <div className="flex">
                <CTALinkOrButton
                  variant="primary"
                  size="small"
                  url={discussionButtonInfo.buttonUrl}
                  disabled={discussionButtonInfo.disabled}
                  target={discussionButtonInfo.openInNewTab ? '_blank' : undefined}
                  className="w-full"
                >
                  {discussionButtonInfo.buttonText}
                </CTALinkOrButton>
              </div>
            )}
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
              {/* Show upcoming discussion info when collapsed on desktop */}
              {!isExpanded && !isCompleted && nextDiscussion && !loading && (
                <p className="text-size-xs text-gray-600 mt-1">
                  Unit {nextDiscussion.unitNumber} starts in {formatTimeUntilDiscussion(nextDiscussion.startDateTime)}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* View certificate button - only for completed courses */}
              {isCompleted && (
                <CTALinkOrButton
                  variant="black"
                  size="small"
                  url={courseRegistration.certificateId
                    ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
                    : course.path}
                >
                  View your certificate
                </CTALinkOrButton>
              )}

              {/* Show primary button for discussion when collapsed on desktop */}
              {!isExpanded && !isCompleted && discussionButtonInfo && !loading && (
                <CTALinkOrButton
                  variant="primary"
                  size="small"
                  url={discussionButtonInfo.buttonUrl}
                  disabled={discussionButtonInfo.disabled}
                  target={discussionButtonInfo.openInNewTab ? '_blank' : undefined}
                >
                  {discussionButtonInfo.buttonText}
                </CTALinkOrButton>
              )}

              {/* Expand/collapse button - only for in-progress courses */}
              {!isCompleted && (
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded view - only for in-progress courses */}
      {isExpanded && !isCompleted && (
        <CourseDetails
          course={course}
          courseRegistration={courseRegistration}
          authToken={authToken}
          isLast={isLast}
        />
      )}
    </div>
  );
};

export default CourseListRow;
