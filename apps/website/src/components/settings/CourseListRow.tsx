import { useState, useEffect, ReactNode } from 'react';
import {
  CTALinkOrButton, addQueryParam, useCurrentTimeMs, cn,
} from '@bluedot/ui';
import { FaCheck } from 'react-icons/fa6';
import { Course, CourseRegistration, MeetPerson } from '@bluedot/db';
import { skipToken } from '@tanstack/react-query';
import CourseDetails from './CourseDetails';
import { ROUTES } from '../../lib/routes';
import GroupSwitchModal from '../courses/GroupSwitchModal';
import { trpc } from '../../utils/trpc';
import type { GroupDiscussion } from '../../server/routers/group-discussions';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import { getActionPlanUrl } from '../../lib/utils';
import { COURSE_CONFIG } from '../../lib/constants';

type CourseListRowProps = {
  course: Course;
  courseRegistration: CourseRegistration;
  isFirst: boolean;
  isLast: boolean;
};

const CourseListRow = ({
  course, courseRegistration, isFirst = false, isLast = false,
}: CourseListRowProps) => {
  const [isExpanded, setIsExpanded] = useState(!courseRegistration.certificateCreatedAt && courseRegistration.roundStatus !== 'Past');
  const currentTimeMs = useCurrentTimeMs();
  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);

  const { data: meetPerson, isLoading: isMeetPersonLoading } = trpc.meetPerson.getByCourseRegistrationId.useQuery(
    { courseRegistrationId: courseRegistration.id },
  );

  // Only fetch expected discussions for the list row
  // Use expectedDiscussionsFacilitator if the user is a facilitator, otherwise use expectedDiscussionsParticipant
  const isFacilitator = courseRegistration.role === 'Facilitator';

  // Edge case: The user has been accepted but has no group assigned
  const isNotInGroup = meetPerson
    && (isFacilitator
      ? !meetPerson.expectedDiscussionsFacilitator || meetPerson.expectedDiscussionsFacilitator.length === 0
      : !meetPerson.groupsAsParticipant || meetPerson.groupsAsParticipant.length === 0);

  const expectedDiscussionIds = isFacilitator
    ? meetPerson?.expectedDiscussionsFacilitator || []
    : meetPerson?.expectedDiscussionsParticipant || [];

  const { data: expectedResults, isLoading: isLoadingDiscussions } = trpc.groupDiscussions.getByDiscussionIds.useQuery(
    expectedDiscussionIds.length > 0 ? { discussionIds: expectedDiscussionIds } : skipToken,
  );

  const { data: attendedResults, isLoading: isLoadingAttendees } = trpc.groupDiscussions.getByDiscussionIds.useQuery(
    (meetPerson?.attendedDiscussions || []).length > 0 ? { discussionIds: meetPerson?.attendedDiscussions || [] } : skipToken,
  );

  // Sort discussions by startDateTime
  const expectedDiscussions = [...(expectedResults?.discussions ?? [])].sort(
    (a, b) => a.startDateTime - b.startDateTime,
  );

  const attendedDiscussions = [...(attendedResults?.discussions ?? [])].sort(
    (a, b) => a.startDateTime - b.startDateTime,
  );

  const isLoading = isMeetPersonLoading || isLoadingDiscussions || isLoadingAttendees;

  useEffect(() => {
    if (isNotInGroup) {
      setIsExpanded(false);
    }
  }, [isNotInGroup]);

  // Get the next upcoming discussion from expectedDiscussions
  const upcomingDiscussions = expectedDiscussions.filter(
    (discussion) => getDiscussionTimeState({ discussion, currentTimeMs }) !== 'ended',
  );
  const nextDiscussion = upcomingDiscussions[0];

  const primaryCtaButton = getPrimaryCtaButton({
    course,
    courseRegistration,
    meetPerson,
    expectedDiscussions,
    nextDiscussion,
    currentTimeMs,
    isLoading,
  });

  const subtitle = getSubtitle({
    course,
    courseRegistration,
    meetPerson,
    expectedDiscussions,
    nextDiscussion,
    isLoading,
    isNotInGroup,
  });

  return (
    <div>
      <div
        className={cn(
          'border-x border-t border-charcoal-light transition-colors duration-200 group cursor-pointer',
          isLast && !isExpanded && 'border-b',
          isFirst && 'rounded-t-xl',
          isLast && !isExpanded && 'rounded-b-xl',
          isExpanded ? 'bg-white' : 'hover:bg-white',
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="p-4 sm:px-8 sm:py-6">
          {/* Mobile layout */}
          <div className="flex flex-col gap-4 sm:hidden">
            {/* Top row: Title and Expand button */}
            <div className="flex items-start gap-3">
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-size-md text-black text-pretty">{course.title}</h3>
                {subtitle && (
                  <p className="flex items-center gap-1.5 mt-1.5 text-size-xs font-medium text-gray-500 leading-4">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Expand/collapse button */}
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
            </div>

            {/* Bottom row: Action buttons */}
            {!isExpanded && primaryCtaButton && (
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
              {subtitle && (
                <p className="flex items-center gap-1.5 mt-0.5 text-size-xs font-medium text-gray-500 leading-4">
                  {subtitle}
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
              {/* Show primary button when collapsed on desktop */}
              {!isExpanded && primaryCtaButton}

              {/* Expand/collapse button */}
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
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <CourseDetails
          course={course}
          courseRegistration={courseRegistration}
          isLast={isLast}
          attendedDiscussions={attendedDiscussions}
          upcomingDiscussions={upcomingDiscussions}
          isLoading={isLoading}
        />
      )}

      {/* Group switching modal for participants without a group */}
      {groupSwitchModalOpen && course.slug && (
        <GroupSwitchModal
          handleClose={() => setGroupSwitchModalOpen(false)}
          initialSwitchType="Switch group permanently"
          courseSlug={course.slug}
        />
      )}
    </div>
  );
};

export default CourseListRow;

function getMaxUnitNumber(discussions: GroupDiscussion[]): number | null {
  const unitNumbers = discussions
    .map((d) => d.unitNumber)
    .filter((n): n is number => n !== null);

  return unitNumbers.length > 0 ? Math.max(...unitNumbers) : null;
}

const getCertificateEligibility = ({
  courseSlug,
  attendedCount,
  expectedCount,
  hasSubmittedActionPlan,
}: {
  courseSlug: string;
  attendedCount: number;
  expectedCount: number;
  hasSubmittedActionPlan: boolean;
}): { isEligible: boolean; reason: 'low-attendance' | 'missing-action-plan' | null } => {
  const missedCount = expectedCount - attendedCount;

  // Low attendance takes precedence. There is no point submitting action plan if you haven't attended enough
  if (expectedCount > 0 && missedCount > 1) {
    return { isEligible: false, reason: 'low-attendance' };
  }
  const requiresActionPlan = COURSE_CONFIG[courseSlug]?.certificateRequiresActionPlan;
  if (requiresActionPlan && !hasSubmittedActionPlan) {
    return { isEligible: false, reason: 'missing-action-plan' };
  }
  return { isEligible: true, reason: null };
};

const getPrimaryCtaButton = ({
  course,
  courseRegistration,
  meetPerson,
  expectedDiscussions,
  nextDiscussion,
  currentTimeMs,
  isLoading,
}: {
  course: Course;
  courseRegistration: CourseRegistration;
  meetPerson: MeetPerson | null | undefined;
  expectedDiscussions: GroupDiscussion[];
  nextDiscussion: GroupDiscussion | undefined;
  currentTimeMs: number;
  isLoading: boolean;
}): ReactNode => {
  if (courseRegistration.certificateCreatedAt) {
    return (
      <CTALinkOrButton
        variant="black"
        size="small"
        url={courseRegistration.certificateId
          ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
          : course.path}
        className="w-full sm:w-auto"
      >
        View your certificate
      </CTALinkOrButton>
    );
  }

  if (isLoading) return null;

  // Show action plan button if they've attended enough but haven't submitted
  const { reason } = getCertificateEligibility({
    courseSlug: course.slug,
    attendedCount: meetPerson?.attendedDiscussions?.length ?? 0,
    expectedCount: expectedDiscussions.length,
    hasSubmittedActionPlan: !!(meetPerson?.projectSubmission && meetPerson.projectSubmission.length > 0),
  });
  if (reason === 'missing-action-plan' && meetPerson) {
    return (
      <CTALinkOrButton
        variant="primary"
        size="small"
        url={getActionPlanUrl(meetPerson.id)}
        target="_blank"
        className="w-full sm:w-auto bg-bluedot-normal"
      >
        Submit your action plan
      </CTALinkOrButton>
    );
  }

  if (!nextDiscussion) return null;

  const nextDiscussionTimeState = getDiscussionTimeState({ discussion: nextDiscussion, currentTimeMs });
  const isNextDiscussionSoonOrLive = nextDiscussionTimeState === 'soon' || nextDiscussionTimeState === 'live';

  const buttonText = isNextDiscussionSoonOrLive ? 'Join Discussion' : 'Prepare for discussion';
  let buttonUrl = '#';
  if (isNextDiscussionSoonOrLive) {
    buttonUrl = nextDiscussion.zoomLink || '#';
  } else if (course.slug && nextDiscussion.unitNumber !== null) {
    buttonUrl = `/courses/${course.slug}/${nextDiscussion.unitNumber}`;
  }
  const disabled = !nextDiscussion.zoomLink && isNextDiscussionSoonOrLive;

  return (
    <CTALinkOrButton
      variant="primary"
      size="small"
      url={buttonUrl}
      disabled={disabled}
      target="_blank"
      className="w-full sm:w-auto bg-bluedot-normal"
    >
      {buttonText}
    </CTALinkOrButton>
  );
};

const getSubtitle = ({
  course,
  courseRegistration,
  meetPerson,
  expectedDiscussions,
  nextDiscussion,
  isLoading,
  isNotInGroup,
}: {
  course: Course;
  courseRegistration: CourseRegistration;
  meetPerson: MeetPerson | null | undefined;
  expectedDiscussions: GroupDiscussion[];
  nextDiscussion: GroupDiscussion | undefined;
  isLoading: boolean;
  isNotInGroup: boolean | null | undefined;
}): ReactNode => {
  if (courseRegistration.certificateCreatedAt) {
    return (
      <>
        {`Completed on ${new Date(courseRegistration.certificateCreatedAt * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`}
        <span className="inline-flex items-center justify-center size-3.5 bg-gray-500 rounded-full">
          <FaCheck className="size-1.5 text-white" />
        </span>
      </>
    );
  }

  if (nextDiscussion) {
    if (isLoading) return null;

    const maxUnitNumber = getMaxUnitNumber(expectedDiscussions);
    const groupName = nextDiscussion.groupDetails?.groupName || 'Unknown group';

    if (nextDiscussion.unitNumber !== null && maxUnitNumber !== null) {
      return `Unit ${nextDiscussion.unitNumber}/${maxUnitNumber} · ${groupName}`;
    }

    // Fallback if we don't have unit numbers
    return groupName;
  }

  // Completed course without certificate, explain why
  if (courseRegistration.roundStatus === 'Past' && !courseRegistration.certificateCreatedAt) {
    if (isLoading) return null;

    const { reason } = getCertificateEligibility({
      courseSlug: course.slug,
      attendedCount: meetPerson?.attendedDiscussions?.length ?? 0,
      expectedCount: expectedDiscussions.length,
      hasSubmittedActionPlan: !!(meetPerson?.projectSubmission && meetPerson.projectSubmission.length > 0),
    });

    if (reason === 'low-attendance') {
      return 'To receive a certificate you can miss at most 1 discussion';
    }
    if (reason === 'missing-action-plan') {
      return 'To receive a certificate you must submit your action plan';
    }
    return 'Certificate pending';
  }

  if (isNotInGroup) {
    return 'We\'re assigning you to a group, you\'ll receive an email from us within the next few days';
  }
  return null;
};
