import {
  useState, useEffect, type ReactNode,
} from 'react';
import {
  CTALinkOrButton, addQueryParam, useCurrentTimeMs, cn, Tooltip,
} from '@bluedot/ui';
import { FaCheck, FaLock } from 'react-icons/fa6';
import { type Course, type CourseRegistration, type MeetPerson } from '@bluedot/db';
import { skipToken } from '@tanstack/react-query';
import CourseDetails from './CourseDetails';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ROUTES } from '../../lib/routes';
import GroupSwitchModal, { buildAvailabilityFormUrl } from '../courses/GroupSwitchModal';
import { trpc } from '../../utils/trpc';
import type { GroupDiscussionWithGroupAndUnit } from '../../server/routers/group-discussions';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import { getActionPlanUrl, formatMonthAndDay } from '../../lib/utils';
import { FOAI_COURSE_SLUG } from '../../lib/constants';

const CourseList = ({ courses, startExpanded = false, roundStartDates }: {
  courses: { course: Course; courseRegistration: CourseRegistration }[];
  startExpanded?: boolean;
  roundStartDates?: Record<string, string | null>;
}) => {
  const SEE_ALL_THRESHOLD = 3;

  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? courses : courses.slice(0, SEE_ALL_THRESHOLD);

  return (
    <>
      <div className="border border-charcoal-light rounded-xl overflow-hidden">
        {displayed.map(({ course, courseRegistration }) => (
          <CourseListRow
            key={courseRegistration.id}
            course={course}
            courseRegistration={courseRegistration}
            startExpanded={startExpanded}
            roundStartDate={courseRegistration.roundId ? roundStartDates?.[courseRegistration.roundId] : undefined}
          />
        ))}
      </div>
      {courses.length > SEE_ALL_THRESHOLD && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            aria-expanded={showAll}
            className="text-size-sm font-medium text-bluedot-normal hover:text-blue-700 transition-colors cursor-pointer"
          >
            {showAll ? 'Show less' : `See all (${courses.length}) courses`}
          </button>
        </div>
      )}
    </>
  );
};

export default CourseList;

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

  const { data: meetPerson, isLoading: isMeetPersonLoading } = trpc.meetPerson.getByCourseRegistrationId.useQuery(isFuture ? skipToken : { courseRegistrationId: courseRegistration.id });

  // Only fetch expected discussions for the list row
  // Use expectedDiscussionsFacilitator if the user is a facilitator, otherwise use expectedDiscussionsParticipant
  const isFacilitatorRole = courseRegistration.role === 'Facilitator';

  // Edge case: The user has been accepted but has no group assigned
  const isNotInGroup = meetPerson
    && (isFacilitatorRole
      ? !meetPerson.expectedDiscussionsFacilitator || meetPerson.expectedDiscussionsFacilitator.length === 0
      : !meetPerson.groupsAsParticipant || meetPerson.groupsAsParticipant.length === 0);

  const expectedDiscussionIds = isFacilitatorRole
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    ? meetPerson?.expectedDiscussionsFacilitator || []
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    : meetPerson?.expectedDiscussionsParticipant || [];

  const { data: expectedResults, isLoading: isLoadingDiscussions } = trpc.groupDiscussions.getByDiscussionIds.useQuery(expectedDiscussionIds.length > 0 ? { discussionIds: expectedDiscussionIds } : skipToken);

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const { data: attendedResults, isLoading: isLoadingAttendees } = trpc.groupDiscussions.getByDiscussionIds.useQuery((meetPerson?.attendedDiscussions || []).length > 0 ? { discussionIds: meetPerson?.attendedDiscussions || [] } : skipToken);

  // Sort discussions by startDateTime
  const expectedDiscussions = [...(expectedResults?.discussions ?? [])].sort((a, b) => a.startDateTime - b.startDateTime);

  const allAttendedDiscussions = [...(attendedResults?.discussions ?? [])].sort((a, b) => a.startDateTime - b.startDateTime);

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
  const upcomingDiscussions = expectedDiscussions.filter((discussion) => getDiscussionTimeState({ discussion, currentTimeMs }) !== 'ended');
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
  const toggleExpand = () => {
    if (!canExpand) {
      return;
    }

    setIsExpanded(!isExpanded);
  };

  const chevron = <ChevronRightIcon className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />;
  const expandButtonLabel = isExpanded ? `Collapse ${course.title} details` : `Expand ${course.title} details`;
  const onExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand();
  };

  const stopPropagation = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };

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
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-size-md sm:text-size-sm text-black sm:text-gray-900 text-pretty sm:leading-normal">
                {course.title}{' '}
                {reasonNotEligibleForCert && (
                  <span className="ml-0.5 inline-flex items-center align-middle">
                    <Tooltip content={reasonNotEligibleForCert} ariaLabel="Show certificate eligibility information" />
                  </span>
                )}
                {isFuture && (
                  <span className="ml-0.5 inline-flex items-center align-middle">
                    <Tooltip content="We typically finalise all application decisions and group discussion times 1 week before the start of the course." ariaLabel="Show application timeline information" />
                  </span>
                )}
              </h3>
              {subtitle && (
                <p className="flex items-center gap-1.5 mt-1.5 sm:mt-0.5 text-size-xs font-medium text-gray-500 leading-4">
                  {subtitle}
                </p>
              )}
            </div>
            {/* Mobile chevron */}
            {canExpand && (
              <button type="button" onClick={onExpandClick} className="sm:hidden size-9 flex items-center justify-center hover:bg-gray-100 rounded-md transition-all duration-150 flex-shrink-0" aria-label={expandButtonLabel} aria-expanded={isExpanded}>
                {chevron}
              </button>
            )}
            {/* Desktop actions + chevron */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0" {...stopPropagation} role="presentation">
              {ctaButtons.length > 0 && ctaButtons}
              {canExpand && (
                <button type="button" onClick={onExpandClick} className="size-9 flex items-center justify-center hover:bg-gray-100 rounded-md transition-all duration-150" aria-label={expandButtonLabel} aria-expanded={isExpanded}>
                  {chevron}
                </button>
              )}
            </div>
          </div>
          {/* Mobile CTA buttons */}
          {!isExpanded && ctaButtons.length > 0 && (
            <div className="flex gap-2 mt-4 sm:hidden" {...stopPropagation} role="presentation">
              {ctaButtons}
            </div>
          )}
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

function getMaxUnitNumber(discussions: GroupDiscussionWithGroupAndUnit[]): number | null {
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
  nextDiscussion: GroupDiscussionWithGroupAndUnit | undefined;
  currentTimeMs: number;
  isExpanded: boolean;
  isLoading: boolean;
  isFacilitatorRole: boolean;
}): ReactNode[] => {
  // Future courses: show availability + curriculum buttons
  if (courseRegistration.roundStatus === 'Future') {
    const buttons: ReactNode[] = [];

    const hasAvailability = !!courseRegistration.availabilityIntervalsUTC;
    const availabilityUrl = buildAvailabilityFormUrl({
      email: courseRegistration.email,
      utmSource: 'bluedot-settings-upcoming',
      courseRegistration,
      roundId: courseRegistration.roundId ?? '',
    });
    buttons.push(<CTALinkOrButton
      key="availability"
      variant="primary"
      size="small"
      url={availabilityUrl}
      target="_blank"
      className="w-full sm:w-auto bg-bluedot-normal"
    >
      {hasAvailability ? 'Edit your availability' : 'Submit your availability'}
    </CTALinkOrButton>);

    if (course.slug) {
      buttons.push(<CTALinkOrButton
        key="curriculum"
        variant="outline-black"
        size="small"
        url={`/courses/${course.slug}/1/1`}
        className="w-full sm:w-auto border-bluedot-darker"
      >
        View curriculum
      </CTALinkOrButton>);
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

  if (isLoading) {
    return [];
  }

  // Join or prepare link for next discussion: Hide if expanded because the button is repeated below
  if (courseRegistration.roundStatus === 'Active' && !isExpanded && nextDiscussion) {
    const nextDiscussionTimeState = getDiscussionTimeState({ discussion: nextDiscussion, currentTimeMs });
    const isNextDiscussionSoonOrLive = nextDiscussionTimeState === 'soon' || nextDiscussionTimeState === 'live';

    const buttonText = isNextDiscussionSoonOrLive ? 'Join Discussion' : 'Prepare for discussion';
    let buttonUrl = '#';
    if (isNextDiscussionSoonOrLive) {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
      buttons.push(<CTALinkOrButton
        key="feedback"
        variant="outline-black"
        size="small"
        url={feedbackFormUrl}
        target="_blank"
        className="w-full sm:w-auto border-bluedot-darker"
      >
        Share feedback
      </CTALinkOrButton>);
    }

    // Action plan button (only for courses that require it)
    if (requiresActionPlan && !isFacilitatorRole) {
      if (hasSubmittedActionPlan) {
        // Action plan submitted - show filled checkmark button (non-interactive)
        buttons.push(<CTALinkOrButton
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
        </CTALinkOrButton>);
      } else if (meetPerson) {
        // Action plan NOT submitted - show submit button
        buttons.push(<CTALinkOrButton
          key="action-plan"
          variant="black"
          size="small"
          url={getActionPlanUrl(meetPerson.id)}
          target="_blank"
          className="w-full sm:w-auto"
        >
          Submit action plan
        </CTALinkOrButton>);
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
  expectedDiscussions: GroupDiscussionWithGroupAndUnit[];
  nextDiscussion: GroupDiscussionWithGroupAndUnit | undefined;
  isLoading: boolean;
  isNotInGroup: boolean | null | undefined;
  isFacilitatorRole: boolean;
  roundStartDate?: string | null;
}): ReactNode => {
  if (courseRegistration.roundStatus === 'Future') {
    const statusText = courseRegistration.decision === 'Accept'
      ? 'Application accepted!'
      : 'Application in review';

    const formattedDate = roundStartDate ? formatMonthAndDay(roundStartDate) : null;

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
    if (isLoading) {
      return null;
    }

    const maxUnitNumber = getMaxUnitNumber(expectedDiscussions);
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const groupName = nextDiscussion.groupDetails?.groupName || 'Unknown group';

    if (nextDiscussion.unitNumber !== null && maxUnitNumber !== null) {
      return `Unit ${nextDiscussion.unitNumber}/${maxUnitNumber} · ${groupName}`;
    }

    // Fallback if we don't have unit numbers
    return groupName;
  }

  // Completed course without certificate - show attendance count
  if (courseRegistration.roundStatus === 'Past') {
    if (isLoading) {
      return null;
    }

    const attended = meetPerson?.uniqueDiscussionAttendance ?? 0;
    const total = meetPerson?.numUnits ?? 0;
    return `You attended ${attended} out of ${total} discussions`;
  }

  if (isNotInGroup) {
    return 'We\'re assigning you to a group, you\'ll receive an email from us within the next few days';
  }

  return null;
};
