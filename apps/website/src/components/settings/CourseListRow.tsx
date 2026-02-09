import {
  useState, useEffect, ReactNode,
} from 'react';
import {
  CTALinkOrButton, addQueryParam, useCurrentTimeMs, cn, Tooltip,
} from '@bluedot/ui';
import { FaCheck, FaLock } from 'react-icons/fa6';
import { Course, CourseRegistration, MeetPerson } from '@bluedot/db';
import { skipToken } from '@tanstack/react-query';
import CourseDetails from './CourseDetails';
import { ROUTES } from '../../lib/routes';
import GroupSwitchModal, { buildAvailabilityFormUrl } from '../courses/GroupSwitchModal';
import { trpc } from '../../utils/trpc';
import type { GroupDiscussion } from '../../server/routers/group-discussions';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import { getActionPlanUrl } from '../../lib/utils';
import { FOAI_COURSE_SLUG } from '../../lib/constants';

type CourseListRowProps = {
  course: Course;
  courseRegistration: CourseRegistration;
  startExpanded?: boolean;
  roundStartDate?: string | null;
};

const CourseListRow = ({
  course, courseRegistration, startExpanded = false, roundStartDate,
}: CourseListRowProps) => {
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const currentTimeMs = useCurrentTimeMs();
  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);

  const isFuture = courseRegistration.roundStatus === 'Future';

  const { data: meetPerson, isLoading: isMeetPersonLoading } = trpc.meetPerson.getByCourseRegistrationId.useQuery(
    isFuture ? skipToken : { courseRegistrationId: courseRegistration.id },
  );

  // Only fetch expected discussions for the list row
  // Use expectedDiscussionsFacilitator if the user is a facilitator, otherwise use expectedDiscussionsParticipant
  const isFacilitatorRole = courseRegistration.role === 'Facilitator';

  // Edge case: The user has been accepted but has no group assigned
  const isNotInGroup = meetPerson
    && (isFacilitatorRole
      ? !meetPerson.expectedDiscussionsFacilitator || meetPerson.expectedDiscussionsFacilitator.length === 0
      : !meetPerson.groupsAsParticipant || meetPerson.groupsAsParticipant.length === 0);

  const expectedDiscussionIds = isFacilitatorRole
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

  const allAttendedDiscussions = [...(attendedResults?.discussions ?? [])].sort(
    (a, b) => a.startDateTime - b.startDateTime,
  );

  const facilitatorDiscussionIds = new Set(meetPerson?.expectedDiscussionsFacilitator ?? []);
  const facilitatedDiscussions = allAttendedDiscussions.filter((d) => facilitatorDiscussionIds.has(d.id));
  const attendedDiscussions = allAttendedDiscussions.filter((d) => !facilitatorDiscussionIds.has(d.id));

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

  const ctaButtons = getCtaButtons({
    course,
    courseRegistration,
    meetPerson,
    nextDiscussion,
    currentTimeMs,
    isExpanded,
    isLoading,
    isFacilitatorRole,
  });

  const subtitle = getSubtitle({
    courseRegistration,
    meetPerson,
    expectedDiscussions,
    nextDiscussion,
    isLoading,
    isNotInGroup,
    isFacilitatorRole,
    roundStartDate,
  });

  // Determine if we need to show eligibility tooltip for facilitated courses
  let reasonNotEligibleForCert: string | null = null;
  const isFacilitatedCourse = course.slug !== FOAI_COURSE_SLUG;

  if (!isFacilitatorRole && !courseRegistration.certificateCreatedAt && isFacilitatedCourse
    && meetPerson?.uniqueDiscussionAttendance != null && meetPerson?.numUnits != null
  ) {
    const hasSubmittedActionPlan = (meetPerson?.projectSubmission?.length ?? 0) > 0;
    const { numUnits, uniqueDiscussionAttendance } = meetPerson;
    const hasAttendedEnough = numUnits === 0 || (numUnits - uniqueDiscussionAttendance) <= 1;

    if (!hasAttendedEnough || !hasSubmittedActionPlan) {
      reasonNotEligibleForCert = 'To be eligible for a certificate, you need to submit your action plan/project and miss no more than 1 discussion.';
    }
  }

  const canExpand = !isFuture;
  const toggleExpand = () => { if (canExpand) setIsExpanded(!isExpanded); };

  return (
    <div className="border-b border-charcoal-light last:border-b-0">
      <div
        className={cn(
          'transition-colors duration-200 group',
          canExpand && 'cursor-pointer',
          canExpand && (isExpanded ? 'bg-white' : 'hover:bg-white'),
        )}
        onClick={toggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpand();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={canExpand ? isExpanded : undefined}
      >
        <div className="p-4 sm:px-8 sm:py-6">
          {/* Mobile layout */}
          <div className="flex flex-col gap-4 sm:hidden">
            {/* Top row: Title and Expand button */}
            <div className="flex items-start gap-3">
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-size-md text-black text-pretty">
                  {course.title}{' '}
                  {reasonNotEligibleForCert && (
                    <span className="ml-0.5 inline-flex items-center align-middle">
                      <Tooltip content={reasonNotEligibleForCert} ariaLabel="Show certificate eligibility information" />
                    </span>
                  )}
                  {isFuture && courseRegistration.decision === null && (
                    <span className="ml-0.5 inline-flex items-center align-middle">
                      <Tooltip content="We typically finalise all application decisions and group discussion times 1 week before the start of the course." ariaLabel="Show application timeline information" />
                    </span>
                  )}
                </h3>
                {subtitle && (
                  <p className="flex items-center gap-1.5 mt-1.5 text-size-xs font-medium text-gray-500 leading-4">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Expand/collapse button */}
              {canExpand && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand();
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
            {!isExpanded && ctaButtons.length > 0 && (
              <div
                className="flex gap-2"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                {ctaButtons}
              </div>
            )}
          </div>

          {/* Desktop layout - original design */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-size-base text-gray-900 leading-normal">
                {course.title}{' '}
                {reasonNotEligibleForCert && (
                  <span className="ml-0.5 inline-flex items-center align-middle">
                    <Tooltip content={reasonNotEligibleForCert} ariaLabel="Show certificate eligibility information" />
                  </span>
                )}
                {isFuture && courseRegistration.decision === null && (
                  <span className="ml-0.5 inline-flex items-center align-middle">
                    <Tooltip content="We typically finalise all application decisions and group discussion times 1 week before the start of the course." ariaLabel="Show application timeline information" />
                  </span>
                )}
              </h3>
              {subtitle && (
                <p className="flex items-center gap-1.5 mt-0.5 text-size-xs font-medium text-gray-500 leading-4">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-2 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              {ctaButtons.length > 0 && ctaButtons}

              {/* Expand/collapse button */}
              {canExpand && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand();
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

      {canExpand && isExpanded && (
        <CourseDetails
          course={course}
          courseRegistration={courseRegistration}
          attendedDiscussions={attendedDiscussions}
          upcomingDiscussions={upcomingDiscussions}
          facilitatedDiscussions={facilitatedDiscussions}
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

const getCtaButtons = ({
  course,
  courseRegistration,
  meetPerson,
  nextDiscussion,
  currentTimeMs,
  isExpanded,
  isLoading,
  isFacilitatorRole,
}: {
  course: Course;
  courseRegistration: CourseRegistration;
  meetPerson: MeetPerson | null | undefined;
  nextDiscussion: GroupDiscussion | undefined;
  currentTimeMs: number;
  isExpanded: boolean;
  isLoading: boolean;
  isFacilitatorRole: boolean;
}): ReactNode[] => {
  // Future courses: show availability + curriculum buttons
  if (courseRegistration.roundStatus === 'Future') {
    const buttons: ReactNode[] = [];

    if (courseRegistration.decision !== 'Reject') {
      const hasAvailability = !!courseRegistration.availabilityIntervalsUTC;
      const availabilityUrl = buildAvailabilityFormUrl({
        email: courseRegistration.email,
        utmSource: 'bluedot-settings-upcoming',
        courseRegistration,
        roundId: courseRegistration.roundId ?? '',
      });
      buttons.push(
        <CTALinkOrButton
          key="availability"
          variant="primary"
          size="small"
          url={availabilityUrl}
          target="_blank"
          className="w-full sm:w-auto bg-bluedot-normal"
        >
          {hasAvailability ? 'Edit your availability' : 'Submit your availability'}
        </CTALinkOrButton>,
      );
    }

    if (course.slug) {
      buttons.push(
        <CTALinkOrButton
          key="curriculum"
          variant="outline-black"
          size="small"
          url={`/courses/${course.slug}/1/1`}
          className="w-full sm:w-auto border-bluedot-darker"
        >
          View curriculum
        </CTALinkOrButton>,
      );
    }

    return buttons;
  }

  const feedbackFormUrl = meetPerson?.courseFeedbackForm;
  const hasSubmittedFeedback = (meetPerson?.courseFeedback?.length ?? 0) > 0;
  const hasSubmittedActionPlan = (meetPerson?.projectSubmission?.length ?? 0) > 0;
  // All facilitated courses (non-FOAI) require action plan/project submission
  const requiresActionPlan = course.slug !== FOAI_COURSE_SLUG;

  // Certificate exists but feedback not yet submitted: show locked certificate button linking to feedback form
  // (Facilitators don't get certificates, so skip this for them)
  if (!isFacilitatorRole && courseRegistration.certificateCreatedAt && !hasSubmittedFeedback && feedbackFormUrl) {
    return [(
      <CTALinkOrButton
        key="locked-cert"
        variant="black"
        size="small"
        url={feedbackFormUrl}
        target="_blank"
        className="w-full sm:w-auto gap-1.5"
      >
        <FaLock className="-translate-y-px" />
        <span>Share feedback to view your certificate</span>
      </CTALinkOrButton>
    )];
  }

  // Certificate exists and feedback submitted (or no feedback form): show view certificate button
  if (courseRegistration.certificateCreatedAt) {
    const certificateUrl = courseRegistration.certificateId
      ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
      : course.path;

    return [(
      <CTALinkOrButton
        key="view-cert"
        variant="black"
        size="small"
        url={certificateUrl}
        className="w-full sm:w-auto"
      >
        View your certificate
      </CTALinkOrButton>
    )];
  }

  if (isLoading) return [];

  // Join or prepare link for next discussion: Hide if expanded because the button is repeated below
  if (courseRegistration.roundStatus === 'Active' && !isExpanded && nextDiscussion) {
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

    return [(
      <CTALinkOrButton
        key="discussion"
        variant="primary"
        size="small"
        url={buttonUrl}
        disabled={disabled}
        target="_blank"
        className="w-full sm:w-auto bg-bluedot-normal"
      >
        {buttonText}
      </CTALinkOrButton>
    )];
  }

  if (courseRegistration.roundStatus === 'Past') {
    const buttons: ReactNode[] = [];

    if (feedbackFormUrl && !hasSubmittedFeedback) {
      buttons.push(
        <CTALinkOrButton
          key="feedback"
          variant="outline-black"
          size="small"
          url={feedbackFormUrl}
          target="_blank"
          className="w-full sm:w-auto border-bluedot-darker"
        >
          Share feedback
        </CTALinkOrButton>,
      );
    }

    // Action plan button (only for courses that require it)
    if (requiresActionPlan && !isFacilitatorRole) {
      if (hasSubmittedActionPlan) {
        // Action plan submitted - show filled checkmark button (non-interactive)
        buttons.push(
          <CTALinkOrButton
            key="action-plan"
            variant="black"
            size="small"
            disabled
            className="w-full sm:w-auto disabled:opacity-80 gap-1.5"
          >
            <span>Action plan submitted</span>
            <span className="inline-flex -translate-y-px items-center justify-center size-3.5 bg-white rounded-full">
              <FaCheck className="size-1.5 text-bluedot-darker" />
            </span>
          </CTALinkOrButton>,
        );
      } else if (meetPerson) {
        // Action plan NOT submitted - show submit button
        buttons.push(
          <CTALinkOrButton
            key="action-plan"
            variant="black"
            size="small"
            url={getActionPlanUrl(meetPerson.id)}
            target="_blank"
            className="w-full sm:w-auto"
          >
            Submit action plan
          </CTALinkOrButton>,
        );
      }
    }

    return buttons;
  }

  return [];
};

const getSubtitle = ({
  courseRegistration,
  meetPerson,
  expectedDiscussions,
  nextDiscussion,
  isLoading,
  isNotInGroup,
  isFacilitatorRole,
  roundStartDate,
}: {
  courseRegistration: CourseRegistration;
  meetPerson: MeetPerson | null | undefined;
  expectedDiscussions: GroupDiscussion[];
  nextDiscussion: GroupDiscussion | undefined;
  isLoading: boolean;
  isNotInGroup: boolean | null | undefined;
  isFacilitatorRole: boolean;
  roundStartDate?: string | null;
}): ReactNode => {
  if (courseRegistration.roundStatus === 'Future') {
    let statusText: string;
    switch (courseRegistration.decision) {
      case 'Accept':
        statusText = 'Application accepted!';
        break;
      case 'Reject':
        statusText = 'Application rejected';
        break;
      default:
        statusText = 'Application in review';
        break;
    }

    const formattedDate = roundStartDate
      ? new Date(roundStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null;

    return (
      <>
        <span className="text-bluedot-normal font-medium">{statusText}</span>
        {formattedDate && (
          <>
            <span>·</span>
            <span>Course starts {formattedDate}</span>
          </>
        )}
      </>
    );
  }

  if (isFacilitatorRole && courseRegistration.roundName) {
    return (
      <span className="min-w-0 text-pretty">
        {courseRegistration.roundName}
        {' '}
        <span className="inline-flex items-center justify-center size-3.5 bg-gray-500 rounded-full align-text-bottom ml-0.5">
          <FaCheck className="size-1.5 text-white" />
        </span>
      </span>
    );
  }

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

  // Completed course without certificate - show attendance count
  if (courseRegistration.roundStatus === 'Past') {
    if (isLoading) return null;

    const attended = meetPerson?.uniqueDiscussionAttendance ?? 0;
    const total = meetPerson?.numUnits ?? 0;
    return `You attended ${attended} out of ${total} discussions`;
  }

  if (isNotInGroup) {
    return 'We\'re assigning you to a group, you\'ll receive an email from us within the next few days';
  }
  return null;
};
