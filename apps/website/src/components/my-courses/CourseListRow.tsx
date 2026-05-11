import type {
  Course, CourseRegistration, Group, GroupDiscussion, Unit,
} from '@bluedot/db';
import {
  CTALinkOrButton, OverflowMenu, Tooltip, type OverflowMenuItemProps, addQueryParam, useLatestUtmParams,
} from '@bluedot/ui';
import { Fragment, useState, type ReactNode } from 'react';
import { FaCheck, FaLock } from 'react-icons/fa6';
import { IoBan } from 'react-icons/io5';
import { ChevronRightIcon } from '../icons';
import { COURSE_CONFIG, FOAI_COURSE_SLUG } from '../../lib/constants';
import { COURSE_COLORS, type CourseColorSlug } from '../../lib/courseColors';
import { ROUTES } from '../../lib/routes';
import { appendPosthogSessionIdPrefill } from '../../lib/appendPosthogSessionIdPrefill';
import { buildGroupSlackChannelUrl, formatMonthAndDay, getActionPlanUrl } from '../../lib/utils';
import DropoutModal from '../courses/DropoutModal';
import GroupSwitchModal, { buildAvailabilityFormUrl, type SwitchType } from '../courses/GroupSwitchModal';
import ViewParticipantsModal from '../courses/ViewParticipantsModal';
import DiscussionList from './DiscussionList';

// TODO give more descriptive name
export type CourseRowData = {
  courseRegistration: CourseRegistration;
  course: Pick<Course, 'slug' | 'title' | 'applyUrl'>;
  group: Pick<Group, 'startTimeUtc' | 'slackChannelId' | 'discussionDoc'> | null;
  facilitatorNames: string[];
  meetPersonId: string | null;
  roundId: string | null;
  discussions: GroupDiscussion[];
  attendedDiscussionIds: string[];
  units: Record<string, Unit>;
  roundStartDate: string | null;
  roundEndDate: string | null;
  rescheduleEligibleUnits: string[];
  numUnits: number | null;
  uniqueDiscussionAttendance: number | null;
  hasSubmittedActionPlan: boolean;
  feedbackFormUrl: string | null;
  hasSubmittedFeedback: boolean;
};

export type CourseListRowProps = CourseRowData & {
  isExpanded: boolean;
  onToggleExpand: () => void;
};

const classifyCourseRegistration = (cr: CourseRegistration) => {
  if (cr.dropoutId?.length && !cr.deferredId?.length) return 'dropped';
  if (cr.roundStatus === 'Active') return 'in-progress';
  if (cr.roundStatus === 'Future') return 'upcoming';
  return 'completed';
};

// True when the row is both expandable and has discussions to render. Used by the page
// to pick which row in each tab auto-expands on first render.
type AutoExpandInput = Pick<CourseRowData, 'courseRegistration' | 'attendedDiscussionIds' | 'discussions'>;

export const isAutoExpandCandidate = (course: AutoExpandInput): boolean => {
  const state = classifyCourseRegistration(course.courseRegistration);
  const canExpand = state !== 'dropped' || course.attendedDiscussionIds.length > 0;
  return canExpand && course.discussions.length > 0;
};

const formatWeeklySchedule = (group: Pick<Group, 'startTimeUtc'> | null): string | null => {
  if (!group?.startTimeUtc) return null;
  const date = new Date(group.startTimeUtc * 1000);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${weekday}s, ${time}`;
};

const formatRoundDateRange = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();
  const sameMonth = sameYear && startDate.getUTCMonth() === endDate.getUTCMonth();
  const startStr = startDate.toLocaleDateString('en-US', sameYear
    ? { month: 'short', day: 'numeric', timeZone: 'UTC' }
    : {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
  if (sameMonth) {
    return `${startStr} – ${endDate.getUTCDate()}, ${endDate.getUTCFullYear()}`;
  }

  const endStr = endDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
  return `${startStr} – ${endStr}`;
};

export const getSubtitle = ({
  courseRegistration,
  group,
  facilitatorNames,
  numUnits,
  uniqueDiscussionAttendance,
  isNotInGroup,
  roundStartDate,
  roundEndDate,
}: {
  courseRegistration: CourseRegistration;
  group: Pick<Group, 'startTimeUtc'> | null;
  facilitatorNames: string[];
  numUnits: number | null;
  uniqueDiscussionAttendance: number | null;
  isNotInGroup: boolean;
  roundStartDate: string | null;
  roundEndDate: string | null;
}): ReactNode => {
  const renderParts = (parts: ReactNode[]): ReactNode | null => {
    const filtered = parts.filter((p) => p != null && p !== '');
    if (filtered.length === 0) return null;
    return (
      <>
        {filtered.map((part, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="hidden sm:inline"> · </span>}
            <span className={`block sm:inline ${i > 0 ? 'mt-0.5 sm:mt-0' : ''}`}>{part}</span>
          </Fragment>
        ))}
      </>
    );
  };

  const state = classifyCourseRegistration(courseRegistration);
  const dateRange = roundStartDate && roundEndDate ? formatRoundDateRange(roundStartDate, roundEndDate) : null;
  const facilitatorDisplay = facilitatorNames.length > 0 ? `Facilitated by ${facilitatorNames.join(', ')}` : null;

  // Future
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

    return renderParts([
      <span key="status" className="text-bluedot-normal font-medium">{statusText}</span>,
      roundStartDate ? `Course starts ${formatMonthAndDay(roundStartDate)}` : null,
    ]);
  }

  // Past + cert
  if (courseRegistration.certificateCreatedAt && dateRange) {
    return renderParts([dateRange, facilitatorDisplay]);
  }

  // Past + no cert
  if (state === 'completed' && !courseRegistration.certificateCreatedAt) {
    const showAttendance = numUnits != null && numUnits > 0;
    return renderParts([
      dateRange,
      showAttendance ? `You attended ${uniqueDiscussionAttendance ?? 0} out of ${numUnits} discussions` : null,
    ]);
  }

  // Dropped
  if (state === 'dropped' && dateRange) {
    return dateRange;
  }

  // Accepted, not yet placed in a group
  if (isNotInGroup) {
    return renderParts([
      <span key="assigning">
        We&apos;re assigning you to a group
        <span className="hidden sm:inline">, you&apos;ll receive an email from us within the next few days</span>
      </span>,
      roundStartDate ? `Course starts ${formatMonthAndDay(roundStartDate)}` : null,
    ]);
  }

  // In-progress (default): recurring schedule + facilitator
  return renderParts([formatWeeklySchedule(group), facilitatorDisplay]);
};

const CourseListRow = ({
  course, courseRegistration, group, facilitatorNames, discussions, attendedDiscussionIds, units, roundId,
  roundStartDate, roundEndDate, rescheduleEligibleUnits, meetPersonId,
  numUnits, uniqueDiscussionAttendance, hasSubmittedActionPlan, feedbackFormUrl, hasSubmittedFeedback,
  isExpanded, onToggleExpand,
}: CourseListRowProps) => {
  // TODO rename to something more descriptive
  const state = classifyCourseRegistration(courseRegistration);
  const [dropoutOpen, setDropoutOpen] = useState(false);
  const [viewParticipantsOpen, setViewParticipantsOpen] = useState(false);
  // TODO give more descriptive name
  const [groupSwitch, setGroupSwitch] = useState<{ unitNumber: string; switchType: SwitchType } | null>(null);
  const { latestUtmParams } = useLatestUtmParams();

  const isFacilitatedCourse = course.slug !== FOAI_COURSE_SLUG;
  const hasCert = !!courseRegistration.certificateCreatedAt;

  const isNotInGroup = !!meetPersonId && !group;
  const subtitle = getSubtitle({
    courseRegistration,
    group,
    facilitatorNames,
    numUnits,
    uniqueDiscussionAttendance,
    isNotInGroup,
    roundStartDate,
    roundEndDate,
  });

  // Show the cert-eligibility tooltip when a Past, no-cert, facilitated-course participant
  // hasn't met both criteria yet (miss ≤ 1 discussion AND submit action plan).
  let certEligibilityReason: string | null = null;
  if (
    !hasCert
    && isFacilitatedCourse
    && uniqueDiscussionAttendance != null
    && numUnits != null
  ) {
    const hasAttendedEnough = numUnits === 0 || (numUnits - uniqueDiscussionAttendance) <= 1;
    if (!hasAttendedEnough || !hasSubmittedActionPlan) {
      certEligibilityReason = 'To be eligible for a certificate, you need to submit your action plan/project and miss no more than 1 discussion.';
    }
  }

  const showApplicationTimelineTooltip = state === 'upcoming' && courseRegistration.decision !== 'Reject';

  // Dropped rows can still expand if the user attended any discussions before dropping.
  const canExpand = state !== 'dropped' || attendedDiscussionIds.length > 0;
  const courseConfig = COURSE_CONFIG[course.slug];
  const tint = COURSE_COLORS[course.slug as CourseColorSlug]?.bright;

  const certificateUrl = courseRegistration.certificateId
    ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
    : `/courses/${course.slug}`;
  const showLockedCert = state === 'completed' && hasCert && !hasSubmittedFeedback && feedbackFormUrl;

  const baseApplicationUrl = course.applyUrl ?? '';
  const applyAgainUrl = baseApplicationUrl
    ? appendPosthogSessionIdPrefill(latestUtmParams.utm_source
      ? addQueryParam(baseApplicationUrl, 'prefill_Source', latestUtmParams.utm_source)
      : baseApplicationUrl)
    : `/courses/${course.slug}`;

  const showActionPlan = state === 'completed' && !hasCert && isFacilitatedCourse && meetPersonId && courseRegistration.role !== 'Facilitator';
  const slackUrl = group?.slackChannelId ? buildGroupSlackChannelUrl(group.slackChannelId) : null;
  const docUrl = group?.discussionDoc ?? null;

  // TODO inline
  const openReschedule = (unitNumber: string | null, switchType: SwitchType) => {
    setGroupSwitch({ unitNumber: unitNumber ?? '1', switchType });
  };

  const toggleExpand = () => {
    if (canExpand) onToggleExpand();
  };

  const chevronButton = canExpand ? (
    <button
      type="button"
      onClick={toggleExpand}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? `Collapse ${course.title}` : `Expand ${course.title}`}
      className="flex size-[38px] cursor-pointer items-center justify-center text-bluedot-normal sm:size-5"
    >
      <ChevronRightIcon className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
    </button>
  ) : null;

  // All course-row actions, declared in one table. `variant` decides where it surfaces.
  //   inline    — inline button or pill on both viewports
  //   overflow  — only in the 3-dot overflow menu
  type CourseAction = {
    id: string;
    isVisible: boolean;
    variant: 'inline' | 'overflow';
    inline?: ReactNode;
    overflow?: OverflowMenuItemProps;
  };

  const inProgressOrUpcoming = state === 'in-progress' || state === 'upcoming';
  const actions: CourseAction[] = [
    {
      id: 'share-feedback',
      isVisible: Boolean(showLockedCert && feedbackFormUrl),
      variant: 'inline',
      inline: feedbackFormUrl ? (
        <CTALinkOrButton variant="primary" size="small" url={feedbackFormUrl} target="_blank" className="gap-1.5 text-size-xxs">
          <FaLock />
          <span>Share feedback<span className="hidden sm:inline"> to view your certificate</span></span>
        </CTALinkOrButton>
      ) : null,
    },
    {
      id: 'view-certificate',
      isVisible: state === 'completed' && hasCert && !showLockedCert,
      variant: 'inline',
      inline: <CTALinkOrButton variant="primary" size="small" url={certificateUrl} className="text-size-xxs">View certificate</CTALinkOrButton>,
    },
    {
      id: 'action-plan',
      isVisible: Boolean(showActionPlan),
      variant: 'inline',
      inline: hasSubmittedActionPlan ? (
        <CTALinkOrButton variant="primary" size="small" disabled className="gap-1.5 text-size-xxs disabled:opacity-80">
          <span>Action plan submitted</span>
          <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-white">
            <FaCheck className="size-1.5 text-bluedot-darker" />
          </span>
        </CTALinkOrButton>
      ) : (
        <CTALinkOrButton variant="primary" size="small" url={getActionPlanUrl(meetPersonId ?? '')} target="_blank" className="text-size-xxs">
          Submit action plan
        </CTALinkOrButton>
      ),
    },
    {
      id: 'availability',
      isVisible: state === 'upcoming' && courseRegistration.decision !== 'Reject',
      variant: 'inline',
      inline: (
        <CTALinkOrButton
          variant="primary"
          size="small"
          url={buildAvailabilityFormUrl({
            email: courseRegistration.email,
            utmSource: 'bluedot-settings-upcoming',
            courseRegistration,
            roundId: courseRegistration.roundId ?? '',
          })}
          target="_blank"
          className="text-size-xxs"
        >
          {courseRegistration.availabilityIntervalsUTC ? 'Edit your availability' : 'Submit your availability'}
        </CTALinkOrButton>
      ),
    },
    {
      id: 'view-curriculum',
      isVisible: state === 'upcoming',
      variant: 'overflow',
      overflow: {
        id: 'view-curriculum', label: 'View curriculum', href: `/courses/${course.slug}/1/1`,
      },
    },
    {
      id: 'dropped-pill',
      isVisible: state === 'dropped',
      variant: 'inline',
      inline: (
        <span className="inline-flex h-9 items-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker">
          <IoBan aria-hidden size={14} />
          Dropped
        </span>
      ),
    },
    {
      id: 'apply-again',
      isVisible: state === 'dropped',
      variant: 'inline',
      inline: <CTALinkOrButton variant="primary" size="small" url={applyAgainUrl} target="_blank" className="text-size-xxs">Apply again</CTALinkOrButton>,
    },
    {
      id: 'open-doc',
      isVisible: Boolean(docUrl),
      variant: 'overflow',
      overflow: {
        id: 'doc', label: 'Open discussion doc', href: docUrl ?? '', target: '_blank',
      },
    },
    {
      id: 'open-slack',
      isVisible: Boolean(slackUrl),
      variant: 'overflow',
      overflow: {
        id: 'slack', label: 'Open Slack group', href: slackUrl ?? '', target: '_blank',
      },
    },
    {
      id: 'view-participants',
      isVisible: state !== 'dropped' && Boolean(group),
      variant: 'overflow',
      overflow: {
        id: 'view-participants', label: 'View participants', onAction: () => setViewParticipantsOpen(true),
      },
    },
    {
      // TODO flag in PR that I explicitly decided to keep this — Switch group permanently is not in
      // Cyrus's overflow design but is useful enough to retain.
      id: 'switch-group-permanently',
      isVisible: inProgressOrUpcoming && !isNotInGroup,
      variant: 'overflow',
      overflow: {
        id: 'switch-group-permanently',
        label: 'Switch group permanently',
        onAction: () => setGroupSwitch({ unitNumber: '1', switchType: 'Switch group permanently' }),
      },
    },
    {
      id: 'drop',
      isVisible: inProgressOrUpcoming,
      variant: 'overflow',
      overflow: {
        id: 'drop', label: 'Drop or defer course', onAction: () => setDropoutOpen(true),
      },
    },
  ];

  const visible = actions.filter((a) => a.isVisible);
  const inlineActions = visible.filter((a) => a.variant === 'inline');
  const overflowItems: OverflowMenuItemProps[] = visible
    .filter((a) => a.variant === 'overflow' && a.overflow)
    .map((a) => a.overflow!);
  const hasInlineActions = inlineActions.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-color-divider bg-white">
      <div className="relative">
        {tint && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(ellipse 50% 230% at 50% -30%, ${tint} 0%, rgba(255,255,255,0) 100%)` }}
          />
        )}
        <div
          className="relative flex items-start gap-4 p-5 pb-3.5 sm:items-center sm:p-6"
        >
          <div
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:size-16 sm:rounded-2xl"
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            style={{ backgroundColor: courseConfig?.iconBackground || 'var(--color-bluedot-normal)' }}
          >
            {courseConfig?.icon && <img src={courseConfig.icon} className="size-7 sm:size-10" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-size-md font-semibold text-bluedot-navy sm:text-size-lg">
              {course.title}
              {certEligibilityReason && (
                <span className="ml-1.5 -translate-y-px inline-flex items-center align-middle">
                  <Tooltip content={certEligibilityReason} ariaLabel="Show certificate eligibility information" />
                </span>
              )}
              {showApplicationTimelineTooltip && (
                <span className="ml-1.5 -translate-y-px inline-flex items-center align-middle">
                  <Tooltip
                    content="We typically finalise all application decisions and group discussion times 1 week before the start of the course."
                    ariaLabel="Show application timeline information"
                  />
                </span>
              )}
            </h3>
            {subtitle && (
              <p className="mt-1 text-size-xs text-bluedot-navy">{subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 self-stretch sm:flex-row sm:items-center sm:gap-4 sm:self-auto">
            {/* Wide text CTAs / pills — desktop only; on mobile they live in a separate row below. */}
            <div className="hidden items-center gap-3 sm:flex">
              {inlineActions.map((a) => <Fragment key={a.id}>{a.inline}</Fragment>)}
              {state !== 'dropped' && overflowItems.length > 0 && (
                <OverflowMenu ariaLabel="Course actions" items={overflowItems} />
              )}
            </div>
            {/* Mobile only: RHS buttons stacked vertically */}
            <div className="flex flex-1 flex-col items-center justify-between gap-2 sm:hidden">
              {state !== 'dropped' && overflowItems.length > 0 ? (
                <OverflowMenu ariaLabel="Course actions" items={overflowItems} />
              ) : <span aria-hidden />}
              {!hasInlineActions && chevronButton}
            </div>
            {chevronButton && <span className="hidden sm:inline">{chevronButton}</span>}
          </div>
        </div>
        {/* Mobile-only: pill + primary actions as a full-width row below the title block */}
        {hasInlineActions && (
          <div className="relative flex items-center gap-2 px-5 pb-3.5 sm:hidden">
            <div className="flex flex-1 flex-wrap gap-2">
              {inlineActions.map((a) => <Fragment key={a.id}>{a.inline}</Fragment>)}
            </div>
            {chevronButton}
          </div>
        )}
      </div>
      {isExpanded && canExpand && (
        <div className="border-t border-color-divider">
          {discussions.length > 0 ? (
            <DiscussionList
              discussions={discussions}
              units={units}
              attendedDiscussionIds={attendedDiscussionIds}
              courseSlug={course.slug}
              canReschedule={state !== 'dropped' && !hasCert}
              rescheduleEligibleUnits={rescheduleEligibleUnits}
              onReschedule={openReschedule}
            />
          ) : (
            <p className="px-5 py-4 text-size-xs text-gray-500 sm:px-6">No discussions to show.</p>
          )}
        </div>
      )}
      {dropoutOpen && (
        <DropoutModal
          applicantId={courseRegistration.id}
          courseSlug={course.slug}
          currentRoundId={courseRegistration.roundId ?? null}
          handleClose={() => setDropoutOpen(false)}
        />
      )}
      {viewParticipantsOpen && meetPersonId && (
        <ViewParticipantsModal meetPersonId={meetPersonId} handleClose={() => setViewParticipantsOpen(false)} />
      )}
      {groupSwitch && roundId && (
        <GroupSwitchModal
          handleClose={() => setGroupSwitch(null)}
          initialUnitNumber={groupSwitch.unitNumber}
          initialSwitchType={groupSwitch.switchType}
          courseSlug={course.slug}
          roundId={roundId}
        />
      )}
    </div>
  );
};

export default CourseListRow;
