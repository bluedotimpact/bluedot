import type {
  Course, CourseRegistration, Group, GroupDiscussion, Unit,
} from '@bluedot/db';
import {
  Eyebrow, H3, OverflowMenu, Tooltip,
} from '@bluedot/ui';
import { Fragment, type ReactNode } from 'react';
import { ChevronRightIcon } from '../icons';
import { COURSE_CONFIG } from '../../lib/constants';
import { COURSE_COLORS, type CourseColorSlug } from '../../lib/courseColors';
import { formatMonthAndDay, parseWeekFromRoundName } from '../../lib/utils';
import DiscussionList from './DiscussionList';
import { classifyCourseRegistration, useCourseListRow } from './useCourseListRow';

export type CourseListRowMode = 'participant' | 'facilitator';

export type MyCoursesPageCourseRegistration = Pick<
  CourseRegistration,
  | 'id'
  | 'courseId'
  | 'email'
  | 'decision'
  | 'certificateId'
  | 'certificateCreatedAt'
  | 'roundId'
  | 'roundName'
  | 'roundStatus'
  | 'availabilityIntervalsUTC'
>;

type CommonRowProps = {
  courseRegistration: MyCoursesPageCourseRegistration;
  course: Pick<Course, 'slug' | 'title' | 'applyUrl'>;
  group: Group | null;
  meetPersonId: string | null;
  roundId: string | null;
  discussions: GroupDiscussion[];
  attendedDiscussionIds: string[];
  units: Record<string, Unit>;
  roundStartDate: string | null;
  roundEndDate: string | null;
  hasSubmittedFeedback: boolean;
  isDroppedOut: boolean;
  isDeferred: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
};

export type ParticipantRowProps = CommonRowProps & {
  mode: 'participant';
  facilitatorNames: string[];
  groupsAsParticipant: string[] | null;
  rescheduleEligibleUnits: string[];
  numUnits: number | null;
  uniqueDiscussionAttendance: number | null;
  hasSubmittedActionPlan: boolean;
  feedbackFormUrl: string | null;
};

export type FacilitatorRowProps = CommonRowProps & {
  mode: 'facilitator';
  roundIntensity: string | null;
};

export type CourseListRowProps = ParticipantRowProps | FacilitatorRowProps;

const CourseListRow = (row: CourseListRowProps) => {
  const {
    mode, course, courseRegistration, meetPersonId,
    discussions, attendedDiscussionIds, units, isExpanded, onToggleExpand,
  } = row;

  const {
    inlineActions, overflowItems, state, canExpand, certEligibilityReason,
    showApplicationTimelineTooltip, modalElement, modalCallbacks,
  } = useCourseListRow(row);

  const courseConfig = COURSE_CONFIG[course.slug];
  const tint = COURSE_COLORS[course.slug as CourseColorSlug]?.bright;

  const isNotInGroup = row.mode === 'participant'
    && !!meetPersonId
    && (!row.groupsAsParticipant || row.groupsAsParticipant.length === 0);
  const subtitle = getSubtitle(row, { isNotInGroup });

  const toggleExpand = () => {
    if (canExpand) onToggleExpand?.();
  };

  const hasInlineActions = inlineActions.length > 0;

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
            <img
              src={courseConfig?.icon ?? '/images/logo/BlueDot_Impact_Icon_White.svg'}
              className="size-7 sm:size-10"
            />
          </div>
          <div className="min-w-0 flex-1">
            {row.mode === 'facilitator' && (
              <Eyebrow className="mb-1">
                {course.title}
              </Eyebrow>
            )}
            <H3 className={`text-pretty text-size-md ${row.mode === 'facilitator' ? '' : 'sm:text-size-lg'}`}>
              <a
                href={`/courses/${course.slug}`}
                className="text-bluedot-navy no-underline transition-colors hover:text-bluedot-normal hover:underline underline-offset-2"
              >
                {row.mode === 'facilitator' ? getFacilitatorHeadline(row) : course.title}
              </a>
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
            </H3>
            {subtitle && (
              <p className="mt-1 text-size-xs text-bluedot-navy">{subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 self-stretch sm:flex-row sm:items-center sm:gap-4 sm:self-auto">
            {/* Desktop only: Wide text CTAs / pills; on mobile they live in a separate row below */}
            <div className="hidden items-center gap-3 sm:flex">
              {inlineActions}
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
              {inlineActions}
            </div>
            {chevronButton}
          </div>
        )}
      </div>
      {isExpanded && canExpand && (
        <div className="border-t border-color-divider">
          {discussions.length > 0 ? (
            <DiscussionList
              mode={mode}
              discussions={discussions}
              units={units}
              attendedDiscussionIds={attendedDiscussionIds}
              courseSlug={course.slug}
              canReschedule={state !== 'dropped' && !courseRegistration.certificateCreatedAt}
              rescheduleEligibleUnits={row.mode === 'participant' ? row.rescheduleEligibleUnits : []}
              onClickReschedule={modalCallbacks.onClickReschedule}
              onClickFacilitatorReschedule={modalCallbacks.onClickFacilitatorReschedule}
              onClickFacilitatorAssignSubstitute={modalCallbacks.onClickFacilitatorAssignSubstitute}
              onClickViewAttendees={modalCallbacks.onClickViewAttendees}
            />
          ) : (
            <p className="px-5 py-4 text-size-xs text-gray-500 sm:px-6">No discussions to show.</p>
          )}
        </div>
      )}
      {modalElement}
    </div>
  );
};

const formatWeeklySchedule = (group: Pick<Group, 'startTimeUtc'> | null): string | null => {
  if (!group?.startTimeUtc) return null;
  const date = new Date(group.startTimeUtc * 1000);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${weekday}s, ${time}`;
};

const formatFacilitatorTime = (startTimeUtc: number, intensity: string | null): string => {
  const date = new Date(startTimeUtc * 1000);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (intensity === 'Part-time') {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${weekday}s ${time}`;
  }

  return time;
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

export const getSubtitle = (
  row: CourseListRowProps,
  { isNotInGroup }: { isNotInGroup: boolean },
): ReactNode => {
  if (row.mode === 'facilitator') return getFacilitatorSubtitle(row);

  return getParticipantSubtitle(row, isNotInGroup);
};

export const getFacilitatorHeadline = (row: FacilitatorRowProps): string => {
  const { courseRegistration, group, roundIntensity } = row;
  const week = parseWeekFromRoundName(courseRegistration.roundName);
  let groupPart: string | null | undefined = null;
  if (group) {
    groupPart = group.groupNumber != null ? `Group ${group.groupNumber}` : group.groupName;
  }

  const headline = [
    week !== null ? `Week ${week}` : null,
    roundIntensity,
    groupPart,
  ].filter(Boolean).join(' ');
  const timePart = group?.startTimeUtc ? formatFacilitatorTime(group.startTimeUtc, roundIntensity) : null;
  return [headline, timePart].filter(Boolean).join(' · ');
};

const getFacilitatorSubtitle = (row: FacilitatorRowProps): ReactNode => {
  const { roundStartDate, roundEndDate } = row;
  const dateRange = roundStartDate && roundEndDate ? formatRoundDateRange(roundStartDate, roundEndDate) : null;
  return dateRange ? <span className="block">{dateRange}</span> : null;
};

const getParticipantSubtitle = (row: ParticipantRowProps, isNotInGroup: boolean): ReactNode => {
  const {
    courseRegistration, group, facilitatorNames, numUnits, uniqueDiscussionAttendance, roundStartDate, roundEndDate,
    isDroppedOut, isDeferred,
  } = row;

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

  const state = classifyCourseRegistration(courseRegistration, { isDroppedOut, isDeferred });
  const dateRange = roundStartDate && roundEndDate ? formatRoundDateRange(roundStartDate, roundEndDate) : null;
  const facilitatorDisplay = facilitatorNames.length > 0 ? `Facilitated by ${facilitatorNames.join(', ')}` : null;

  // Dropped
  if (state === 'dropped') {
    return dateRange;
  }

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

    // Suppress the "Course starts" addendum for rejected applicants
    const startsAddendum = courseRegistration.decision !== 'Reject' && roundStartDate
      ? `Course starts ${formatMonthAndDay(roundStartDate)}`
      : null;

    return renderParts([
      <span key="status" className="text-bluedot-normal font-medium">{statusText}</span>,
      startsAddendum,
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

export default CourseListRow;
