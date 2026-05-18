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
import {
  buildApplicationUrl, buildGroupSlackChannelUrl, formatMonthAndDay, getActionPlanUrl, parseWeekFromRoundName,
} from '../../lib/utils';
import DropoutModal from '../courses/DropoutModal';
import FacilitatorSwitchModal, {
  type FacilitatorModalType, type FacilitatorSwitchType,
} from '../courses/FacilitatorSwitchModal';
import GroupSwitchModal, { buildAvailabilityFormUrl, type SwitchType } from '../courses/GroupSwitchModal';
import ViewParticipantsModal from '../courses/ViewParticipantsModal';
import DiscussionList from './DiscussionList';
import type { CourseAction } from './DiscussionListRow';

export type CourseListRowMode = 'participant' | 'facilitator';

type CommonRowProps = {
  courseRegistration: CourseRegistration;
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

const CourseListRow = (props: CourseListRowProps) => {
  const {
    mode, course, courseRegistration, group, meetPersonId, roundId,
    discussions, attendedDiscussionIds, units,
    hasSubmittedFeedback, isExpanded, onToggleExpand,
  } = props;
  const state = classifyCourseRegistration(courseRegistration);
  const [dropoutModalOpen, setDropoutModalOpen] = useState(false);
  const [viewParticipantsModalOpen, setViewParticipantsModalOpen] = useState(false);
  const [groupSwitchModalProps, setGroupSwitchModalProps] = useState<{ initialUnitNumber: string; initialSwitchType: SwitchType } | null>(null);
  const [facilitatorSwitchProps, setFacilitatorSwitchProps] = useState<{
    initialModalType: FacilitatorModalType;
    initialSwitchType?: FacilitatorSwitchType;
    initialDiscussion: { id: string; group: string } | null;
  } | null>(null);
  const { latestUtmParams } = useLatestUtmParams();

  const isFacilitatedCourse = course.slug !== FOAI_COURSE_SLUG;
  const hasCert = !!courseRegistration.certificateCreatedAt;
  // Dropped rows can still expand if the user attended any discussions before dropping.
  const canExpand = state !== 'dropped' || attendedDiscussionIds.length > 0;
  const courseConfig = COURSE_CONFIG[course.slug];
  const tint = COURSE_COLORS[course.slug as CourseColorSlug]?.bright;
  const certificateUrl = courseRegistration.certificateId
    ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
    : `/courses/${course.slug}`;
  const applyAgainUrl = buildApplicationUrl(course.applyUrl, latestUtmParams.utm_source) || `/courses/${course.slug}`;
  const slackUrl = group?.slackChannelId ? buildGroupSlackChannelUrl(group.slackChannelId) : null;
  const docUrl = group?.discussionDoc ?? null;

  // Participant-only derivations. Default to safe false-equivalent values when in facilitator mode.
  const isNotInGroup = props.mode === 'participant'
    && !!meetPersonId
    && (!props.groupsAsParticipant || props.groupsAsParticipant.length === 0);

  const showApplicationTimelineTooltip = props.mode === 'participant'
    && state === 'upcoming'
    && courseRegistration.decision !== 'Reject';

  let certEligibilityReason: string | null = null;
  if (
    props.mode === 'participant'
    && (state === 'in-progress' || state === 'completed')
    && !hasCert
    && isFacilitatedCourse
    && props.uniqueDiscussionAttendance != null
    && props.numUnits != null
  ) {
    const { numUnits, uniqueDiscussionAttendance, hasSubmittedActionPlan } = props;
    const hasAttendedEnough = numUnits === 0 || (numUnits - uniqueDiscussionAttendance) <= 1;
    if (!hasAttendedEnough || !hasSubmittedActionPlan) {
      certEligibilityReason = 'To be eligible for a certificate, you need to submit your action plan/project and miss no more than 1 discussion.';
    }
  }

  const showLockedCert = props.mode === 'participant'
    && state === 'completed' && hasCert && !hasSubmittedFeedback && !!props.feedbackFormUrl;
  const showActionPlan = props.mode === 'participant'
    && state === 'completed' && !hasCert && isFacilitatedCourse && !!meetPersonId;

  const subtitle = getSubtitle(props, { isNotInGroup });

  const toggleExpand = () => {
    if (canExpand) onToggleExpand?.();
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

  const actions = getActions(props, {
    state, hasCert, showLockedCert, showActionPlan,
    certificateUrl, applyAgainUrl, docUrl, slackUrl,
  }, {
    onOpenDropout: () => setDropoutModalOpen(true),
    onOpenViewParticipants: () => setViewParticipantsModalOpen(true),
    onOpenGroupSwitch: (p) => setGroupSwitchModalProps(p),
    onClickFacilitatorRescheduleRecurring: () => setFacilitatorSwitchProps({
      initialModalType: 'Update discussion time',
      initialSwitchType: 'Change permanently',
      initialDiscussion: null,
    }),
  });

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
            <img
              src={courseConfig?.icon ?? '/images/logo/BlueDot_Impact_Icon_White.svg'}
              className="size-7 sm:size-10"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-size-md text-pretty font-semibold text-bluedot-navy sm:text-size-lg">
              <a
                href={`/courses/${course.slug}`}
                className="text-bluedot-navy no-underline transition-colors hover:text-bluedot-normal hover:underline underline-offset-2"
              >
                {course.title}
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
            </h3>
            {subtitle && (
              <p className="mt-1 text-size-xs text-bluedot-navy">{subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 self-stretch sm:flex-row sm:items-center sm:gap-4 sm:self-auto">
            {/* Desktop only: Wide text CTAs / pills; on mobile they live in a separate row below */}
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
              mode={mode}
              discussions={discussions}
              units={units}
              attendedDiscussionIds={attendedDiscussionIds}
              courseSlug={course.slug}
              canReschedule={state !== 'dropped' && !hasCert}
              rescheduleEligibleUnits={props.mode === 'participant' ? props.rescheduleEligibleUnits : []}
              onClickReschedule={({ unitNumber, switchType }) => setGroupSwitchModalProps({ initialUnitNumber: unitNumber ?? '1', initialSwitchType: switchType })}
              onClickFacilitatorReschedule={(d) => setFacilitatorSwitchProps({
                initialModalType: 'Update discussion time',
                initialSwitchType: 'Change for one unit',
                initialDiscussion: { id: d.id, group: d.group },
              })}
              onClickFacilitatorAssignSubstitute={(d) => setFacilitatorSwitchProps({
                initialModalType: 'Change facilitator',
                initialDiscussion: { id: d.id, group: d.group },
              })}
              onClickViewAttendees={group ? () => setViewParticipantsModalOpen(true) : undefined}
            />
          ) : (
            <p className="px-5 py-4 text-size-xs text-gray-500 sm:px-6">No discussions to show.</p>
          )}
        </div>
      )}
      {dropoutModalOpen && (
        <DropoutModal
          applicantId={courseRegistration.id}
          courseSlug={course.slug}
          currentRoundId={courseRegistration.roundId ?? null}
          handleClose={() => setDropoutModalOpen(false)}
        />
      )}
      {viewParticipantsModalOpen && group && (
        <ViewParticipantsModal groupId={group.id} handleClose={() => setViewParticipantsModalOpen(false)} />
      )}
      {groupSwitchModalProps && roundId && (
        <GroupSwitchModal
          handleClose={() => setGroupSwitchModalProps(null)}
          initialUnitNumber={groupSwitchModalProps.initialUnitNumber}
          initialSwitchType={groupSwitchModalProps.initialSwitchType}
          courseSlug={course.slug}
          roundId={roundId}
        />
      )}
      {facilitatorSwitchProps && roundId && (
        <FacilitatorSwitchModal
          handleClose={() => setFacilitatorSwitchProps(null)}
          roundId={roundId}
          initialDiscussion={facilitatorSwitchProps.initialDiscussion}
          initialModalType={facilitatorSwitchProps.initialModalType}
          initialSwitchType={facilitatorSwitchProps.initialSwitchType}
        />
      )}
    </div>
  );
};

export const classifyCourseRegistration = (cr: CourseRegistration) => {
  if (cr.dropoutId?.length && !cr.deferredId?.length) return 'dropped';
  if (cr.roundStatus === 'Active') return 'in-progress';
  if (cr.roundStatus === 'Future') return 'upcoming';
  return 'completed';
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

const getFacilitatorSubtitle = (row: FacilitatorRowProps): ReactNode => {
  const {
    courseRegistration, group, roundStartDate, roundEndDate, roundIntensity,
  } = row;
  const week = parseWeekFromRoundName(courseRegistration.roundName);
  const isPending = !group;
  const dateRange = roundStartDate && roundEndDate ? formatRoundDateRange(roundStartDate, roundEndDate) : null;

  let groupPart: string | null | undefined = null;
  if (!isPending) {
    groupPart = group.groupNumber != null ? `Group ${group.groupNumber}` : group.groupName;
  }

  const headline = [
    week !== null ? `Week ${week}` : null,
    roundIntensity,
    groupPart,
  ].filter(Boolean).join(' ');

  const timePart = group?.startTimeUtc ? formatFacilitatorTime(group.startTimeUtc, roundIntensity) : null;

  return (
    <>
      {(headline || timePart) && (
        <span className="block">{[headline, timePart].filter(Boolean).join(' · ')}</span>
      )}
      {dateRange && <span className="block">{dateRange}</span>}
    </>
  );
};

const getParticipantSubtitle = (row: ParticipantRowProps, isNotInGroup: boolean): ReactNode => {
  const {
    courseRegistration, group, facilitatorNames, numUnits, uniqueDiscussionAttendance, roundStartDate, roundEndDate,
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

  const state = classifyCourseRegistration(courseRegistration);
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

type ActionDerived = {
  state: ReturnType<typeof classifyCourseRegistration>;
  hasCert: boolean;
  showLockedCert: boolean;
  showActionPlan: boolean;
  certificateUrl: string;
  applyAgainUrl: string;
  docUrl: string | null;
  slackUrl: string | null;
};

type ActionCallbacks = {
  onOpenDropout: () => void;
  onOpenViewParticipants: () => void;
  onOpenGroupSwitch: (props: { initialUnitNumber: string; initialSwitchType: SwitchType }) => void;
  onClickFacilitatorRescheduleRecurring: () => void;
};

export const getActions = (
  row: CourseListRowProps,
  derived: ActionDerived,
  callbacks: ActionCallbacks,
): CourseAction[] => {
  if (row.mode === 'facilitator') return getFacilitatorActions(row, derived, callbacks);
  return getParticipantActions(row, derived, callbacks);
};

const getParticipantActions = (
  row: ParticipantRowProps,
  derived: ActionDerived,
  callbacks: ActionCallbacks,
): CourseAction[] => {
  const {
    courseRegistration, group, hasSubmittedActionPlan, feedbackFormUrl, meetPersonId, rescheduleEligibleUnits,
  } = row;
  const {
    state, hasCert, showLockedCert, showActionPlan, certificateUrl, applyAgainUrl, docUrl, slackUrl,
  } = derived;
  const { onOpenDropout, onOpenViewParticipants, onOpenGroupSwitch } = callbacks;
  const inProgressOrUpcoming = state === 'in-progress' || state === 'upcoming';

  return [
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
        id: 'view-participants', label: 'View participants', onAction: onOpenViewParticipants,
      },
    },
    {
      id: 'switch-group-permanently',
      isVisible: inProgressOrUpcoming && Boolean(group) && rescheduleEligibleUnits.length > 0,
      variant: 'overflow',
      overflow: {
        id: 'switch-group-permanently',
        label: 'Switch group permanently',
        onAction: () => onOpenGroupSwitch({ initialUnitNumber: '1', initialSwitchType: 'Switch group permanently' }),
      },
    },
    {
      id: 'drop',
      isVisible: state === 'in-progress' || (state === 'upcoming' && courseRegistration.decision === 'Accept'),
      variant: 'overflow',
      overflow: {
        id: 'drop', label: 'Drop or defer course', onAction: onOpenDropout,
      },
    },
  ];
};

const getFacilitatorActions = (
  row: FacilitatorRowProps,
  derived: ActionDerived,
  callbacks: ActionCallbacks,
): CourseAction[] => {
  const {
    courseRegistration, group, meetPersonId, hasSubmittedFeedback,
  } = row;
  const { state, docUrl, slackUrl } = derived;
  const { onOpenViewParticipants, onClickFacilitatorRescheduleRecurring } = callbacks;
  const isPending = state === 'upcoming' && !group;
  const isActive = state === 'in-progress' || (state === 'upcoming' && Boolean(group));
  const isPast = state === 'completed';

  return [
    {
      id: 'application-pending-pill',
      isVisible: isPending,
      variant: 'inline',
      inline: (
        <span className="inline-flex h-9 items-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker">
          Application pending
        </span>
      ),
    },
    {
      id: 'availability-facilitator',
      isVisible: isPending && courseRegistration.decision !== 'Reject',
      variant: 'inline',
      inline: (
        <CTALinkOrButton
          variant="primary"
          size="small"
          url={buildAvailabilityFormUrl({
            email: courseRegistration.email,
            utmSource: 'bluedot-facilitated-upcoming',
            courseRegistration,
            roundId: courseRegistration.roundId ?? '',
          })}
          target="_blank"
          className="text-size-xxs"
        >
          {courseRegistration.availabilityIntervalsUTC ? 'Edit your availability' : 'Share availability'}
        </CTALinkOrButton>
      ),
    },
    {
      id: 'share-feedback-facilitator',
      isVisible: isPast && Boolean(meetPersonId),
      variant: 'inline',
      inline: meetPersonId ? (
        <CTALinkOrButton
          variant="primary"
          size="small"
          url={`/facilitator-feedback/${meetPersonId}`}
          className="text-size-xxs"
        >
          {hasSubmittedFeedback ? 'Edit feedback' : 'Share feedback'}
        </CTALinkOrButton>
      ) : null,
    },
    {
      id: 'open-doc',
      isVisible: (isActive || isPast) && Boolean(docUrl),
      variant: 'overflow',
      overflow: {
        id: 'doc', label: 'Open discussion doc', href: docUrl ?? '', target: '_blank',
      },
    },
    {
      id: 'open-slack',
      isVisible: (isActive || isPast) && Boolean(slackUrl),
      variant: 'overflow',
      overflow: {
        id: 'slack', label: 'Open Slack group', href: slackUrl ?? '', target: '_blank',
      },
    },
    {
      id: 'view-participants',
      isVisible: (isActive || isPast) && Boolean(group),
      variant: 'overflow',
      overflow: {
        id: 'view-participants', label: 'View participants', onAction: onOpenViewParticipants,
      },
    },
    {
      id: 'reschedule-recurring',
      isVisible: isActive,
      variant: 'overflow',
      overflow: {
        id: 'reschedule-recurring',
        label: 'Reschedule recurring discussions',
        onAction: onClickFacilitatorRescheduleRecurring,
      },
    },
  ];
};

export default CourseListRow;
