import { useState, useEffect } from 'react';
import { CTALinkOrButton, addQueryParam } from '@bluedot/ui';
import { FaCheck } from 'react-icons/fa6';
import {
  Course, CourseRegistration, MeetPerson,
} from '@bluedot/db';
import useAxios from 'axios-hooks';
import CourseDetails from './CourseDetails';
import { ROUTES } from '../../lib/routes';
import { GetGroupDiscussionResponse, GroupDiscussion } from '../../pages/api/group-discussions/[id]';
import GroupSwitchModal from '../courses/GroupSwitchModal';

type CourseListRowProps = {
  course: Course;
  courseRegistration: CourseRegistration;
  authToken?: string;
  isFirst?: boolean;
  isLast?: boolean;
};

const CourseListRow = ({
  course, courseRegistration, authToken, isFirst = false, isLast = false,
}: CourseListRowProps) => {
  const isCompleted = !!courseRegistration.certificateCreatedAt;
  const [isExpanded, setIsExpanded] = useState(!isCompleted); // Expand by default if in progress
  const [expectedDiscussions, setExpectedDiscussions] = useState<GroupDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(Math.floor(Date.now() / 1000));
  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);

  // Fetch meetPerson data to get discussion IDs
  const [{ data: meetPersonData }] = useAxios<{ type: 'success'; meetPerson: MeetPerson | null }>({
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
      // Use expectedDiscussionsFacilitator if the user is a facilitator, otherwise use expectedDiscussionsParticipant
      const isFacilitator = courseRegistration.role === 'Facilitator';
      const expectedDiscussionIds = isFacilitator
        ? (meetPersonData.meetPerson.expectedDiscussionsFacilitator || [])
        : (meetPersonData.meetPerson.expectedDiscussionsParticipant || []);

      const expectedPromises = expectedDiscussionIds.map(async (id) => {
        try {
          const response = await fetch(`/api/group-discussions/${id}`);
          const data: GetGroupDiscussionResponse = await response.json();
          // Check if the response is successful before accessing discussion
          if (data.type === 'success') {
            return data.discussion;
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const expectedResults = await Promise.all(expectedPromises);

      // Filter out nulls and sort by startDateTime
      const validExpected = expectedResults.filter((d): d is GroupDiscussion => d !== null);
      validExpected.sort((a: GroupDiscussion, b: GroupDiscussion) => a.startDateTime - b.startDateTime);

      setExpectedDiscussions(validExpected);
      setLoading(false);
    };

    fetchDiscussions();
  }, [meetPersonData, isCompleted, courseRegistration.role]);

  // Update current time every 30 seconds for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeSeconds(Math.floor(Date.now() / 1000));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

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

  // Check if next discussion is starting soon (within 1 hour)
  const isNextDiscussionStartingSoon = nextDiscussion
    ? (nextDiscussion.startDateTime - currentTimeSeconds) < 3600 && (nextDiscussion.startDateTime - currentTimeSeconds) > 0
    : false;

  // Check if participant has a group assigned
  const hasNoGroup = !isCompleted && meetPersonData?.meetPerson
    && (!meetPersonData.meetPerson.groupsAsParticipant || meetPersonData.meetPerson.groupsAsParticipant.length === 0);

  const getPrimaryCtaButton = () => {
    if (hasNoGroup) {
      return (
        <CTALinkOrButton
          variant="primary"
          size="small"
          onClick={() => setGroupSwitchModalOpen(true)}
          className="w-full sm:w-auto"
        >
          Join group
        </CTALinkOrButton>
      );
    }

    if (!nextDiscussion) return null;

    const buttonText = isNextDiscussionStartingSoon ? 'Join Discussion' : 'Prepare for discussion';
    let buttonUrl = '#';
    if (isNextDiscussionStartingSoon) {
      buttonUrl = nextDiscussion.zoomLink || '#';
    } else if (course.slug && nextDiscussion.unitNumber) {
      buttonUrl = `/courses/${course.slug}/${nextDiscussion.unitNumber}`;
    }
    const openInNewTab = isNextDiscussionStartingSoon;
    const disabled = !nextDiscussion.zoomLink && isNextDiscussionStartingSoon;

    return (
      <CTALinkOrButton
        variant="primary"
        size="small"
        url={buttonUrl}
        disabled={disabled}
        target={openInNewTab ? '_blank' : undefined}
        className="w-full sm:w-auto"
      >
        {buttonText}
      </CTALinkOrButton>
    );
  };

  const primaryCtaButton = getPrimaryCtaButton();

  // Format completion date
  const metadataText = isCompleted && courseRegistration.certificateCreatedAt
    ? `Completed on ${new Date(courseRegistration.certificateCreatedAt * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`
    : '';

  // Determine hover class based on completion status
  const hoverClass = !isExpanded && !isCompleted ? 'hover:bg-white' : '';

  return (
    <div>
      <div
        className={`border-x border-t ${isLast && !isExpanded ? 'border-b' : ''} ${isFirst ? 'rounded-t-xl' : ''} ${isLast && !isExpanded ? 'rounded-b-xl' : ''} border-gray-200 ${isExpanded ? 'bg-white' : ''} ${hoverClass} transition-colors duration-200 group ${!isCompleted ? 'cursor-pointer' : ''}`}
        onClick={!isCompleted ? () => setIsExpanded(!isExpanded) : undefined}
        onKeyDown={!isCompleted ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        } : undefined}
        role={!isCompleted ? 'button' : undefined}
        tabIndex={!isCompleted ? 0 : undefined}
        aria-expanded={!isCompleted ? isExpanded : undefined}
      >
        <div className="p-4 sm:px-8 sm:py-6">
          {/* Mobile layout */}
          <div className="flex flex-col gap-4 sm:hidden">
            {/* Top row: Title and Expand button */}
            <div className="flex items-start gap-3">
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-size-lg text-black leading-[22px]">{course.title}</h3>
                {metadataText && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-size-xs font-medium text-charcoal-normal opacity-50 leading-4">
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
                  <p
                    className={`text-size-xs mt-1 ${
                      isNextDiscussionStartingSoon ? 'text-blue-600' : 'text-charcoal-normal'
                    }`}
                  >
                    Unit {nextDiscussion.unitNumber} starts in {formatTimeUntilDiscussion(nextDiscussion.startDateTime)}
                  </p>
                )}
              </div>

              {/* Expand/collapse button - only visible for in-progress courses */}
              {!isCompleted && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
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
                      stroke="#1F2937"
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
            {/* Show primary button for discussion or join group when collapsed on mobile */}
            {!isExpanded && !isCompleted && !loading && primaryCtaButton && (
              <div
                className="flex"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                {primaryCtaButton}
              </div>
            )}
          </div>

          {/* Desktop layout - original design */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-size-base text-gray-900 leading-normal">{course.title}</h3>
              {metadataText && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-size-xs font-medium text-gray-900 opacity-50 leading-4">
                    {metadataText}
                  </p>
                  {isCompleted && (
                    <span className="inline-flex items-center justify-center size-3.5 bg-gray-500 rounded-full">
                      <FaCheck className="size-1.5 text-white" />
                    </span>
                  )}
                </div>
              )}
              {/* Show upcoming discussion info when collapsed on desktop */}
              {!isExpanded && !isCompleted && nextDiscussion && !loading && (
                <p
                  className={`text-size-xs mt-1 ${
                    isNextDiscussionStartingSoon ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  Unit {nextDiscussion.unitNumber} starts in {formatTimeUntilDiscussion(nextDiscussion.startDateTime)}
                </p>
              )}
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-3 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
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

              {/* Show primary button for discussion or join group when collapsed on desktop */}
              {!isExpanded && !isCompleted && !loading && primaryCtaButton}

              {/* Expand/collapse button - only for in-progress courses */}
              {!isCompleted && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
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
                      stroke="#1F2937"
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
        />
      )}

      {/* Group switching modal for participants without a group */}
      {groupSwitchModalOpen && course.slug && (
        <GroupSwitchModal
          handleClose={() => setGroupSwitchModalOpen(false)}
          initialSwitchType="Switch group permanently"
          initialIsManual
          courseSlug={course.slug}
        />
      )}
    </div>
  );
};

export default CourseListRow;
