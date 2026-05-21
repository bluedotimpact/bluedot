import {
  CTALinkOrButton, addQueryParam, useLatestUtmParams, type OverflowMenuItemProps,
} from '@bluedot/ui';
import type { CourseRegistration, GroupDiscussion } from '@bluedot/db';
import { Fragment, type ReactNode } from 'react';
import { FaCheck, FaLock } from 'react-icons/fa6';
import { IoBan } from 'react-icons/io5';
import { FOAI_COURSE_SLUG } from '../../lib/constants';
import { ROUTES } from '../../lib/routes';
import { buildApplicationUrl, buildGroupSlackChannelUrl, getActionPlanUrl } from '../../lib/utils';
import { buildAvailabilityFormUrl, type SwitchType } from '../courses/GroupSwitchModal';
import type { CourseListRowProps, FacilitatorRowProps, ParticipantRowProps } from './CourseListRow';
import type { CourseAction } from './DiscussionListRow';
import { useCourseModals, type CourseModalTriggers } from './useCourseModals';

export type CourseRowState = 'in-progress' | 'upcoming' | 'completed' | 'dropped';

export type DropoutStatus = { isDroppedOut: boolean; isDeferred: boolean };

const NOT_DROPPED: DropoutStatus = { isDroppedOut: false, isDeferred: false };

export const classifyCourseRegistration = (
  cr: CourseRegistration,
  status: DropoutStatus = NOT_DROPPED,
): CourseRowState => {
  if (status.isDroppedOut && !status.isDeferred) return 'dropped';
  if (cr.certificateCreatedAt) return 'completed';
  if (cr.roundStatus === 'Active') return 'in-progress';
  if (cr.roundStatus === 'Future') return 'upcoming';
  return 'completed';
};

export type ModalCallbacks = {
  onClickReschedule: (input: { unitNumber: string | null; switchType: SwitchType }) => void;
  onClickFacilitatorReschedule: (discussion: GroupDiscussion) => void;
  onClickFacilitatorAssignSubstitute: (discussion: GroupDiscussion) => void;
  onClickViewAttendees: (() => void) | undefined;
};

export type UseCourseActionsResult = {
  inlineActions: ReactNode[];
  overflowItems: OverflowMenuItemProps[];
  state: CourseRowState;
  canExpand: boolean;
  certEligibilityReason: string | null;
  showApplicationTimelineTooltip: boolean;
  modalElement: ReactNode;
  modalCallbacks: ModalCallbacks;
};

export const useCourseListRow = (row: CourseListRowProps): UseCourseActionsResult => {
  const { latestUtmParams } = useLatestUtmParams();
  const derived = deriveCourseRowState(row, latestUtmParams.utm_source);
  const modals = useCourseModals({
    courseSlug: row.course.slug,
    courseRegistrationId: row.courseRegistration.id,
    currentRoundId: row.courseRegistration.roundId ?? null,
    switchRoundId: row.roundId,
    groupId: row.group?.id ?? null,
  });

  const built = row.mode === 'facilitator'
    ? getFacilitatorActions(row, derived, modals)
    : getParticipantActions(row, derived, modals);

  const visible = built.filter((a) => a.isVisible);
  return {
    inlineActions: visible
      .filter((a) => a.variant === 'inline')
      .map((a) => <Fragment key={a.id}>{a.inline}</Fragment>),
    overflowItems: visible.filter((a) => a.variant === 'overflow' && a.overflow).map((a) => a.overflow!),
    state: derived.state,
    canExpand: derived.canExpand,
    certEligibilityReason: derived.certEligibilityReason,
    showApplicationTimelineTooltip: derived.showApplicationTimelineTooltip,
    modalElement: modals.element,
    modalCallbacks: {
      onClickReschedule: ({ unitNumber, switchType }) => modals.openParticipantReschedule({
        initialUnitNumber: unitNumber ?? '1',
        initialSwitchType: switchType,
      }),
      onClickFacilitatorReschedule: (d) => modals.openFacilitatorRescheduleOneOff({ id: d.id, group: d.group }),
      onClickFacilitatorAssignSubstitute: (d) => modals.openFacilitatorAssignSubstitute({ id: d.id, group: d.group }),
      onClickViewAttendees: row.group ? modals.openViewParticipants : undefined,
    },
  };
};

type CourseRowDerivedState = {
  state: CourseRowState;
  hasCert: boolean;
  canExpand: boolean;
  certEligibilityReason: string | null;
  showApplicationTimelineTooltip: boolean;
  showLockedCert: boolean;
  showActionPlan: boolean;
  certificateUrl: string;
  applyAgainUrl: string;
  docUrl: string | null;
  slackUrl: string | null;
};

const deriveCourseRowState = (row: CourseListRowProps, utmSource: string | undefined): CourseRowDerivedState => {
  const {
    course, courseRegistration, group, meetPersonId, attendedDiscussionIds,
    hasSubmittedFeedback, isDroppedOut, isDeferred,
  } = row;
  const state = classifyCourseRegistration(courseRegistration, { isDroppedOut, isDeferred });
  const hasCert = !!courseRegistration.certificateCreatedAt;
  const isFacilitatedCourse = course.slug !== FOAI_COURSE_SLUG;

  // Dropped rows can still expand if the user attended any discussions before dropping.
  const canExpand = state !== 'dropped' || attendedDiscussionIds.length > 0;

  const certificateUrl = courseRegistration.certificateId
    ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
    : `/courses/${course.slug}`;
  const applyAgainUrl = buildApplicationUrl(course.applyUrl, utmSource) || `/courses/${course.slug}`;
  const slackUrl = group?.slackChannelId ? buildGroupSlackChannelUrl(group.slackChannelId) : null;
  const docUrl = group?.discussionDoc ?? null;

  if (row.mode !== 'participant') {
    return {
      state,
      hasCert,
      canExpand,
      certEligibilityReason: null,
      showApplicationTimelineTooltip: false,
      showLockedCert: false,
      showActionPlan: false,
      certificateUrl,
      applyAgainUrl,
      docUrl,
      slackUrl,
    };
  }

  const showApplicationTimelineTooltip = state === 'upcoming' && courseRegistration.decision !== 'Reject';

  let certEligibilityReason: string | null = null;
  if (
    (state === 'in-progress' || state === 'completed')
    && !hasCert
    && isFacilitatedCourse
    && row.uniqueDiscussionAttendance != null
    && row.numUnits != null
  ) {
    const hasAttendedEnough = row.numUnits === 0 || (row.numUnits - row.uniqueDiscussionAttendance) <= 1;
    if (!hasAttendedEnough || !row.hasSubmittedActionPlan) {
      certEligibilityReason = 'To be eligible for a certificate, you need to submit your action plan/project and miss no more than 1 discussion.';
    }
  }

  const showLockedCert = state === 'completed' && hasCert && !hasSubmittedFeedback && !!row.feedbackFormUrl;
  const showActionPlan = state === 'completed' && !hasCert && isFacilitatedCourse && !!meetPersonId;

  return {
    state,
    hasCert,
    canExpand,
    certEligibilityReason,
    showApplicationTimelineTooltip,
    showLockedCert,
    showActionPlan,
    certificateUrl,
    applyAgainUrl,
    docUrl,
    slackUrl,
  };
};

const getParticipantActions = (
  row: ParticipantRowProps,
  derived: CourseRowDerivedState,
  triggers: CourseModalTriggers,
): CourseAction[] => {
  const {
    courseRegistration, group, hasSubmittedActionPlan, feedbackFormUrl, meetPersonId, rescheduleEligibleUnits,
  } = row;
  const {
    state, hasCert, showLockedCert, showActionPlan, certificateUrl, applyAgainUrl, docUrl, slackUrl,
  } = derived;
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
        id: 'view-participants', label: 'View participants', onAction: triggers.openViewParticipants,
      },
    },
    {
      id: 'switch-group-permanently',
      isVisible: inProgressOrUpcoming && Boolean(group) && rescheduleEligibleUnits.length > 0,
      variant: 'overflow',
      overflow: {
        id: 'switch-group-permanently',
        label: 'Switch group permanently',
        onAction: () => triggers.openParticipantReschedule({ initialUnitNumber: '1', initialSwitchType: 'Switch group permanently' }),
      },
    },
    {
      id: 'drop',
      isVisible: state === 'in-progress' || (state === 'upcoming' && courseRegistration.decision === 'Accept'),
      variant: 'overflow',
      overflow: {
        id: 'drop', label: 'Drop or defer course', onAction: triggers.openDropout,
      },
    },
  ];
};

const getFacilitatorActions = (
  row: FacilitatorRowProps,
  derived: CourseRowDerivedState,
  triggers: CourseModalTriggers,
): CourseAction[] => {
  const {
    courseRegistration, group, meetPersonId, hasSubmittedFeedback,
  } = row;
  const { state, docUrl, slackUrl } = derived;
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
          target="_blank"
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
        id: 'view-participants', label: 'View participants', onAction: triggers.openViewParticipants,
      },
    },
    {
      id: 'reschedule-recurring',
      isVisible: isActive && Boolean(group),
      variant: 'overflow',
      overflow: {
        id: 'reschedule-recurring',
        label: 'Update discussion time',
        onAction: triggers.openFacilitatorRescheduleRecurring,
      },
    },
  ];
};
