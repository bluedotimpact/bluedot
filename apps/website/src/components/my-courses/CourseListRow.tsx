import type {
  Course, CourseRegistration, Group, GroupDiscussion, Unit,
} from '@bluedot/db';
import {
  CTALinkOrButton, OverflowMenu, Tooltip, type OverflowMenuItemProps, addQueryParam,
} from '@bluedot/ui';
import { Fragment, useState, type ReactNode } from 'react';
import { FaCheck, FaLock } from 'react-icons/fa6';
import { IoBan } from 'react-icons/io5';
import { ChevronRightIcon } from '../icons';
import { COURSE_CONFIG, FOAI_COURSE_SLUG } from '../../lib/constants';
import { COURSE_COLORS, type CourseColorSlug } from '../../lib/courseColors';
import { ROUTES } from '../../lib/routes';
import { buildGroupSlackChannelUrl, formatMonthAndDay, getActionPlanUrl } from '../../lib/utils';
import DropoutModal from '../courses/DropoutModal';
import GroupSwitchModal, { type SwitchType } from '../courses/GroupSwitchModal';
import DiscussionList from './DiscussionList';

export type CourseListRowProps = {
  courseRegistration: CourseRegistration;
  course: Course;
  group: Group | null;
  facilitatorNames: string[];
  meetPersonId: string | null;
  roundId: string | null;
  discussions: GroupDiscussion[];
  attendedDiscussionIds: string[];
  units: Record<string, Unit>;
  slackChannelId: string | null;
  activityDoc: string | null;
  roundStartDate: string | null;
  roundEndDate: string | null;
  numUnits: number | null;
  uniqueDiscussionAttendance: number | null;
  hasSubmittedActionPlan: boolean;
  feedbackFormUrl: string | null;
  hasSubmittedFeedback: boolean;
};

const classifyCourseRegistration = (cr: CourseRegistration) => {
  if (cr.dropoutId?.length && !cr.deferredId?.length) return 'dropped';
  if (cr.roundStatus === 'Active') return 'in-progress';
  if (cr.roundStatus === 'Future') return 'upcoming';
  return 'completed';
};

const formatWeeklySchedule = (group: Group | null): string | null => {
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
  group: Group | null;
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
  slackChannelId, activityDoc, roundStartDate, roundEndDate, meetPersonId,
  numUnits, uniqueDiscussionAttendance, hasSubmittedActionPlan, feedbackFormUrl, hasSubmittedFeedback,
}: CourseListRowProps) => {
  const state = classifyCourseRegistration(courseRegistration);
  const [isExpanded, setIsExpanded] = useState(state === 'in-progress');
  const [dropoutOpen, setDropoutOpen] = useState(false);
  const [groupSwitch, setGroupSwitch] = useState<{ unitNumber: string; switchType: SwitchType } | null>(null);

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
  const headerStyle = tint
    ? { background: `radial-gradient(ellipse 50% 230% at 50% -30%, ${tint} 0%, rgba(255,255,255,0) 100%)` }
    : undefined;

  const certificateUrl = courseRegistration.certificateId
    ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
    : `/courses/${course.slug}`;
  const showLockedCert = state === 'completed' && hasCert && !hasSubmittedFeedback && feedbackFormUrl;
  const applyAgainUrl = `/courses/${course.slug}`;
  const showActionPlan = state === 'completed' && !hasCert && isFacilitatedCourse && meetPersonId;
  const slackUrl = slackChannelId ? buildGroupSlackChannelUrl(slackChannelId) : null;
  const docUrl = activityDoc;

  const overflowItems: OverflowMenuItemProps[] = [];
  if (docUrl) {
    overflowItems.push({
      id: 'doc', label: 'Open discussion doc', href: docUrl, target: '_blank',
    });
  }

  if (slackUrl) {
    overflowItems.push({
      id: 'slack', label: 'Open Slack group', href: slackUrl, target: '_blank',
    });
  }

  if (state === 'in-progress' || state === 'upcoming') {
    overflowItems.push({ id: 'drop', label: 'Drop or defer course', onAction: () => setDropoutOpen(true) });
  }

  const openReschedule = (unitNumber: string | null, switchType: SwitchType) => {
    setGroupSwitch({ unitNumber: unitNumber ?? '1', switchType });
  };

  const toggleExpand = () => {
    if (canExpand) setIsExpanded((prev) => !prev);
  };

  const chevronButton = canExpand ? (
    <button
      type="button"
      onClick={toggleExpand}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? `Collapse ${course.title}` : `Expand ${course.title}`}
      className="flex size-5 cursor-pointer items-center justify-center text-bluedot-normal"
    >
      <ChevronRightIcon className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
    </button>
  ) : null;

  // Wide text CTAs / pills. Rendered inline on the right on desktop; full-width row below the
  // title block on mobile (so the title isn't squeezed by long labels like "Share feedback to view
  // your certificate").
  const wideActions = (
    <>
      {showLockedCert && feedbackFormUrl && (
        <CTALinkOrButton
          variant="primary"
          size="small"
          url={feedbackFormUrl}
          target="_blank"
          className="gap-1.5"
        >
          <FaLock />
          <span>Share feedback</span>
        </CTALinkOrButton>
      )}
      {state === 'completed' && hasCert && !showLockedCert && (
        <CTALinkOrButton variant="primary" size="small" url={certificateUrl}>View certificate</CTALinkOrButton>
      )}
      {showActionPlan && (
        hasSubmittedActionPlan ? (
          <CTALinkOrButton variant="primary" size="small" disabled className="gap-1.5 disabled:opacity-80">
            <span>Action plan submitted</span>
            <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-white">
              <FaCheck className="size-1.5 text-bluedot-darker" />
            </span>
          </CTALinkOrButton>
        ) : (
          <CTALinkOrButton
            variant="primary"
            size="small"
            url={getActionPlanUrl(meetPersonId)}
            target="_blank"
          >
            Submit action plan
          </CTALinkOrButton>
        )
      )}
      {state === 'dropped' && (
        <>
          <span className="inline-flex h-9 items-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker">
            <IoBan aria-hidden size={14} />
            Dropped
          </span>
          <CTALinkOrButton variant="primary" size="small" url={applyAgainUrl}>Apply again</CTALinkOrButton>
        </>
      )}
    </>
  );
  const hasWideActions = Boolean(showLockedCert && feedbackFormUrl)
    || (state === 'completed' && hasCert && !showLockedCert)
    || Boolean(showActionPlan)
    || state === 'dropped';

  return (
    <div className="overflow-hidden rounded-xl border border-color-divider bg-white">
      <div
        className="flex items-start gap-4 p-5 pb-3.5 sm:items-center sm:p-6"
        style={headerStyle}
      >
        <div
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:size-16 sm:rounded-2xl"
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          style={{ backgroundColor: courseConfig?.iconBackground || 'var(--color-bluedot-normal)' }}
        >
          {courseConfig?.icon && <img src={courseConfig.icon} alt="" className="size-7 sm:size-10" />}
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
            {wideActions}
            {state !== 'dropped' && overflowItems.length > 0 && (
              <OverflowMenu ariaLabel="Course actions" items={overflowItems} />
            )}
          </div>
          {/* Icon-only actions on mobile. Overflow sticks to the top of the row, chevron (if
              applicable) sits at the bottom — or moves to the wide-actions row when wide
              actions are present. On desktop the overflow moves into the desktop wide-actions
              row above and the chevron lives next to it. */}
          <div className="flex flex-1 flex-col items-center justify-between gap-4 sm:hidden">
            {state !== 'dropped' && overflowItems.length > 0 ? (
              <OverflowMenu ariaLabel="Course actions" items={overflowItems} />
            ) : <span aria-hidden />}
            {!hasWideActions && chevronButton}
          </div>
          {chevronButton && <span className="hidden sm:inline">{chevronButton}</span>}
        </div>
      </div>
      {/* Mobile-only: wide CTAs / pills as a full-width row below the title block.
          Chevron lives here too (rather than the header's right column) so it sits inline
          with the button. */}
      {hasWideActions && (
        <div className="flex items-center gap-2 px-5 pb-3.5 sm:hidden">
          <div className="flex flex-1 flex-wrap gap-2">{wideActions}</div>
          {chevronButton}
        </div>
      )}
      {isExpanded && canExpand && discussions.length > 0 && (
        <div className="border-t border-color-divider">
          <DiscussionList
            discussions={discussions}
            units={units}
            attendedDiscussionIds={attendedDiscussionIds}
            onReschedule={openReschedule}
          />
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
