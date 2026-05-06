import {
  CTALinkOrButton, OverflowMenu, Tooltip, type OverflowMenuItemProps, addQueryParam,
} from '@bluedot/ui';
import { Fragment, useState, type ReactNode } from 'react';
import { FaCheck, FaLock } from 'react-icons/fa6';
import { IoBan, IoChevronDown } from 'react-icons/io5';
import { COURSE_CONFIG, FOAI_COURSE_SLUG } from '../../lib/constants';
import { COURSE_COLORS, type CourseColorSlug } from '../../lib/courseColors';
import { ROUTES } from '../../lib/routes';
import { buildGroupSlackChannelUrl, formatMonthAndDay, getActionPlanUrl } from '../../lib/utils';
import DropoutModal from '../courses/DropoutModal';
import GroupSwitchModal, { type SwitchType } from '../courses/GroupSwitchModal';
import DiscussionList from './DiscussionList';
import type { EnrichedCourse } from './CourseList';

const classifyCourseRegistration = (cr: EnrichedCourse['courseRegistration']) => {
  if (cr.dropoutId?.length && !cr.deferredId?.length) return 'dropped';
  if (cr.roundStatus === 'Active') return 'in-progress';
  if (cr.roundStatus === 'Future') return 'upcoming';
  return 'completed';
};

const recurringScheduleParts = (
  group: EnrichedCourse['group'],
  facilitatorNames: string[],
): string[] => {
  const parts: string[] = [];
  if (group?.startTimeUtc) {
    const date = new Date(group.startTimeUtc * 1000);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    parts.push(`${weekday}s, ${time}`);
  }

  if (facilitatorNames.length > 0) parts.push(`Facilitated by ${facilitatorNames.join(', ')}`);
  return parts;
};

// Render subtitle parts so they wrap onto separate lines on mobile (no dot) and join inline
// with a ` · ` separator on desktop.
const renderParts = (parts: ReactNode[]): ReactNode | null => {
  const filtered = parts.filter((p) => p !== null && p !== undefined && p !== '');
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

const formatRoundDateRange = (start: string, end: string): string => {
  const s = new Date(start);
  const e = new Date(end);
  const opts = (year?: 'numeric') => ({
    month: 'short', day: 'numeric', timeZone: 'UTC', ...(year && { year }),
  } as const);
  if (s.getUTCFullYear() !== e.getUTCFullYear()) {
    return `${s.toLocaleDateString('en-US', opts('numeric'))} – ${e.toLocaleDateString('en-US', opts('numeric'))}`;
  }

  if (s.getUTCMonth() !== e.getUTCMonth()) {
    return `${s.toLocaleDateString('en-US', opts())} – ${e.toLocaleDateString('en-US', opts('numeric'))}`;
  }

  return `${s.toLocaleDateString('en-US', opts())} – ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
};

// TODO cut this comment
// Subtitle precedence chain — first matching branch wins. Ported from legacy `getSubtitle`
// (apps/website/src/components/settings/CourseList.tsx) and edited for the v2 design. Each
// branch answers a specific user question (see gh-settings-courses/legacy-behaviours.md for
// the full audit and design decisions).
export const getSubtitle = ({
  courseRegistration,
  group,
  facilitatorNames,
  discussions,
  numUnits,
  uniqueDiscussionAttendance,
  isNotInGroup,
  roundStartDate,
  roundEndDate,
}: {
  courseRegistration: EnrichedCourse['courseRegistration'];
  group: EnrichedCourse['group'];
  facilitatorNames: string[];
  discussions: EnrichedCourse['discussions'];
  numUnits: number | null;
  uniqueDiscussionAttendance: number | null;
  isNotInGroup: boolean;
  roundStartDate: string | null;
  roundEndDate: string | null;
}): ReactNode => {
  // 1. Future row: application status + optional "Course starts {date}".
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

  // 2. Past + cert: course-duration date range, e.g. "Mar 10 – 17, 2026".
  //    (Legacy showed "Completed on Apr 1, 2026" + checkmark; v2 design uses the round range.)
  if (courseRegistration.certificateCreatedAt && roundStartDate && roundEndDate) {
    return renderParts([
      formatRoundDateRange(roundStartDate, roundEndDate),
      facilitatorNames.length > 0 ? `Facilitated by ${facilitatorNames.join(', ')}` : null,
    ]);
  }

  // 3. Past + no cert: date range + "You attended N out of M discussions". The attendance line
  //    is suppressed when numUnits is 0 / unknown (e.g. FOAI which is self-paced, no discussions).
  const isPast = courseRegistration.roundStatus === 'Past';
  if (isPast && !courseRegistration.certificateCreatedAt) {
    const showAttendance = numUnits != null && numUnits > 0;
    return renderParts([
      roundStartDate && roundEndDate ? formatRoundDateRange(roundStartDate, roundEndDate) : null,
      showAttendance ? `You attended ${uniqueDiscussionAttendance ?? 0} out of ${numUnits} discussions` : null,
    ]);
  }

  // 3b. Dropped: course-duration date range, identifies which round they dropped out of.
  const isDropped = (courseRegistration.dropoutId?.length ?? 0) > 0 && (courseRegistration.deferredId?.length ?? 0) === 0;
  if (isDropped && roundStartDate && roundEndDate) {
    return formatRoundDateRange(roundStartDate, roundEndDate);
  }

  // 4. Accepted-Active but not yet placed in a group.
  if (isNotInGroup) {
    return renderParts([
      <span key="assigning">
        We&apos;re assigning you to a group
        <span className="hidden sm:inline">, you&apos;ll receive an email from us within the next few days</span>
      </span>,
      roundStartDate ? `Course starts ${formatMonthAndDay(roundStartDate)}` : null,
    ]);
  }

  // 5. Active (default fall-through): recurring schedule + facilitator.
  //    Legacy v1 had "Unit N/M · groupName" here; v2 design swaps that for the schedule.
  const scheduleParts = recurringScheduleParts(group, facilitatorNames);
  if (scheduleParts.length > 0 || discussions.length > 0) {
    return renderParts(scheduleParts);
  }

  return null;
};

type CourseListRowProps = {
  course: EnrichedCourse;
};

const CourseListRow = ({ course: c }: CourseListRowProps) => {
  const {
    course, courseRegistration, group, facilitatorNames, discussions, attendedDiscussionIds, units, roundId,
    slackChannelId, activityDoc, roundStartDate, roundEndDate, meetPersonId,
    numUnits, uniqueDiscussionAttendance, hasSubmittedActionPlan, feedbackFormUrl, hasSubmittedFeedback,
  } = c;
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
    discussions,
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
  const showChevron = canExpand;
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

  const handleHeaderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canExpand) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand();
    }
  };

  // Stop the click on action elements from also toggling the header expand state.
  const stopPropagation = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };

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
        className={`flex items-start gap-4 p-5 pb-3.5 sm:p-6 ${canExpand ? 'cursor-pointer' : ''}`}
        style={headerStyle}
        onClick={toggleExpand}
        onKeyDown={handleHeaderKeyDown}
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? isExpanded : undefined}
        aria-label={canExpand ? `${isExpanded ? 'Collapse' : 'Expand'} ${course.title}` : undefined}
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
              <span className="ml-1 inline-flex items-center align-middle" {...stopPropagation} role="presentation">
                <Tooltip content={certEligibilityReason} ariaLabel="Show certificate eligibility information" />
              </span>
            )}
            {showApplicationTimelineTooltip && (
              <span className="ml-1 inline-flex items-center align-middle" {...stopPropagation} role="presentation">
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
        <div
          className="flex shrink-0 flex-col items-end gap-2 self-stretch sm:flex-row sm:items-center sm:gap-4 sm:self-auto"
          {...stopPropagation}
          role="presentation"
        >
          {/* Wide text CTAs / pills — desktop only; on mobile they live in a separate row below. */}
          <div className="hidden items-center gap-3 sm:flex">
            {wideActions}
            {state !== 'dropped' && overflowItems.length > 0 && (
              <OverflowMenu ariaLabel="Course actions" items={overflowItems} />
            )}
          </div>
          {/* Icon-only actions on mobile. Overflow sticks to the top of the row, chevron sits at
              the bottom (or moves to the wide-actions row if any). On desktop the overflow moves
              into the desktop wide-actions row above and only the chevron stays here. */}
          <div className="flex flex-1 flex-col items-center justify-between gap-4 sm:hidden">
            {state !== 'dropped' && overflowItems.length > 0 ? (
              <OverflowMenu ariaLabel="Course actions" items={overflowItems} />
            ) : <span aria-hidden />}
            {showChevron && !hasWideActions && (
              <span aria-hidden className="text-bluedot-normal">
                <IoChevronDown size={20} />
              </span>
            )}
          </div>
          {showChevron && (
            <span
              aria-hidden
              className="hidden size-9 items-center justify-center rounded border border-bluedot-normal text-bluedot-normal sm:flex"
            >
              <IoChevronDown size={20} />
            </span>
          )}
        </div>
      </div>
      {/* Mobile-only: wide CTAs / pills as a full-width row below the title block.
          Chevron lives here too (rather than the header's right column) so it sits inline
          with the button. */}
      {hasWideActions && (
        <div
          className="flex items-center gap-2 px-5 pb-3.5 sm:hidden"
          {...stopPropagation}
          role="presentation"
        >
          <div className="flex flex-1 flex-wrap gap-2">{wideActions}</div>
          {showChevron && (
            <span aria-hidden className="text-bluedot-normal">
              <IoChevronDown size={20} />
            </span>
          )}
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
