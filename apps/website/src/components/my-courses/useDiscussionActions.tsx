import {
  CTALinkOrButton, Tag, useCurrentTimeMs, type OverflowMenuItemProps,
} from '@bluedot/ui';
import { Fragment, useState, type ReactNode } from 'react';
import { IoBan, IoCheckmark } from 'react-icons/io5';
import { downloadDiscussionCalendarFile } from '../../lib/downloadCalendarFile';
import { getDiscussionTimeState, type GroupDiscussionWithEnd } from '../../lib/group-discussions/utils';
import type { CourseAction, DiscussionListRowProps } from './DiscussionListRow';

export type DiscussionStatus = 'upcoming' | 'soon' | 'live' | 'attended' | 'absent';

export type UseDiscussionActionsResult = {
  status: DiscussionStatus;
  inlineActions: ReactNode[];
  desktopOverflowItems: OverflowMenuItemProps[];
  mobileOverflowItems: OverflowMenuItemProps[];
  downloadError: string | null;
};

export const useDiscussionActions = (input: DiscussionListRowProps): UseDiscussionActionsResult => {
  const currentTimeMs = useCurrentTimeMs();
  const status = deriveStatus(input.discussion, input.isAttended, currentTimeMs);

  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloadingCalendar, setIsDownloading] = useState(false);

  const downloadCalendar = async () => {
    if (isDownloadingCalendar) return;
    try {
      setDownloadError(null);
      setIsDownloading(true);
      await downloadDiscussionCalendarFile(input.discussion.id);
    } catch {
      setDownloadError('Could not download the calendar file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const buildInput: BuildInput = {
    ...input, status, isDownloadingCalendar, onDownloadCalendar: downloadCalendar,
  };
  const actions = input.mode === 'facilitator'
    ? facilitatorActions(buildInput)
    : participantActions(buildInput);

  const visible = actions.filter((a) => a.isVisible);
  return {
    status,
    inlineActions: visible
      .filter((a) => a.variant === 'inline')
      .map((a) => <Fragment key={a.id}>{a.inline}</Fragment>),
    desktopOverflowItems: visible
      .filter((a) => a.variant === 'overflow' && a.overflow)
      .map((a) => a.overflow!),
    mobileOverflowItems: visible
      .map((a) => a.overflow)
      .filter((o): o is OverflowMenuItemProps => !!o),
    downloadError,
  };
};

const deriveStatus = (discussion: GroupDiscussionWithEnd, isAttended: boolean, currentTimeMs: number): DiscussionStatus => {
  const timeState = getDiscussionTimeState({ discussion, currentTimeMs });
  // Live wins over attended: suppress the Attended pill while a discussion is in progress so
  // users can't read off "you're counted as attended" the moment they click Join.
  if (timeState === 'live') return 'live';
  if (isAttended) return 'attended';
  if (timeState === 'soon') return 'soon';
  if (timeState === 'ended') return 'absent';
  return 'upcoming';
};

type BuildInput = DiscussionListRowProps & {
  status: DiscussionStatus;
  isDownloadingCalendar: boolean;
  onDownloadCalendar: () => void | Promise<void>;
};

const participantActions = (ctx: BuildInput): CourseAction[] => {
  const {
    status, discussion, canReschedule, isDownloadingCalendar, onReschedule, onDownloadCalendar,
  } = ctx;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const discussionMeetLink = discussion.zoomLink || undefined;
  const isPast = status === 'attended' || status === 'absent';
  const isFutureLike = status === 'upcoming' || status === 'soon' || status === 'live';

  return [
    {
      id: 'reschedule-upcoming',
      isVisible: isFutureLike,
      variant: 'inline',
      inline: <CTALinkOrButton variant="secondary" size="small" onClick={onReschedule} className="text-size-xxs bd-md:text-size-xxs">Reschedule</CTALinkOrButton>,
      overflow: { id: 'reschedule', label: 'Reschedule', onAction: onReschedule },
    },
    {
      id: 'join-now',
      isVisible: status === 'live' && Boolean(discussionMeetLink),
      variant: 'inline',
      inline: discussionMeetLink ? <CTALinkOrButton variant="primary" size="small" url={discussionMeetLink} target="_blank" className="text-size-xxs bd-md:text-size-xxs">Join now</CTALinkOrButton> : null,
      overflow: {
        id: 'join', label: 'Join now', href: discussionMeetLink ?? '', target: '_blank',
      },
    },
    {
      id: 'attended-pill',
      isVisible: status === 'attended',
      variant: 'inline',
      inline: (
        <Tag shape="pill">
          <IoCheckmark aria-hidden />
          Attended
        </Tag>
      ),
    },
    {
      id: 'absent-pill',
      isVisible: status === 'absent',
      variant: 'inline',
      inline: (
        <Tag shape="pill">
          <IoBan aria-hidden />
          Absent
        </Tag>
      ),
    },
    {
      id: 'reschedule-absent',
      isVisible: status === 'absent' && canReschedule,
      variant: 'inline',
      inline: <CTALinkOrButton variant="primary" size="small" onClick={onReschedule} className="text-size-xxs bd-md:text-size-xxs">Reschedule</CTALinkOrButton>,
      overflow: { id: 'reschedule', label: 'Reschedule', onAction: onReschedule },
    },
    {
      id: 'calendar',
      isVisible: !isPast,
      variant: 'overflow',
      overflow: {
        id: 'cal',
        label: isDownloadingCalendar ? 'Downloading calendar file...' : 'Download calendar file',
        onAction: onDownloadCalendar,
      },
    },
  ];
};

const facilitatorActions = (ctx: BuildInput): CourseAction[] => {
  const {
    status, discussion, isDownloadingCalendar, onDownloadCalendar,
    onClickFacilitatorReschedule, onClickFacilitatorAssignSubstitute, onClickViewAttendees,
  } = ctx;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const discussionMeetLink = discussion.zoomLink || undefined;
  const isPast = status === 'attended' || status === 'absent';
  const attendingCount = discussion.participantsExpected?.length ?? 0;

  return [
    {
      id: 'join-now-facilitator',
      isVisible: status === 'live' && Boolean(discussionMeetLink),
      variant: 'inline',
      inline: discussionMeetLink ? (
        <CTALinkOrButton variant="primary" size="small" url={discussionMeetLink} target="_blank" className="text-size-xxs bd-md:text-size-xxs">Join now</CTALinkOrButton>
      ) : null,
      overflow: {
        id: 'join', label: 'Join now', href: discussionMeetLink ?? '', target: '_blank',
      },
    },
    {
      id: 'attending-pill',
      isVisible: !isPast && status !== 'live',
      variant: 'inline',
      inline: (
        <Tag shape="pill">
          {attendingCount} Attending
        </Tag>
      ),
    },
    {
      id: 'facilitated-pill',
      isVisible: isPast,
      variant: 'inline',
      inline: (
        <Tag shape="pill">
          <IoCheckmark aria-hidden />
          Facilitated
        </Tag>
      ),
    },
    {
      id: 'view-attendees',
      isVisible: Boolean(onClickViewAttendees),
      variant: 'overflow',
      overflow: {
        id: 'view-attendees',
        label: 'View attendees',
        onAction: () => onClickViewAttendees?.(),
      },
    },
    {
      id: 'reschedule-one-off',
      isVisible: !isPast && Boolean(onClickFacilitatorReschedule),
      variant: 'overflow',
      overflow: {
        id: 'reschedule-one-off',
        label: 'Reschedule',
        onAction: () => onClickFacilitatorReschedule?.(discussion),
      },
    },
    {
      id: 'assign-substitute',
      isVisible: !isPast && Boolean(onClickFacilitatorAssignSubstitute),
      variant: 'overflow',
      overflow: {
        id: 'assign-substitute',
        label: 'Change facilitator',
        onAction: () => onClickFacilitatorAssignSubstitute?.(discussion),
      },
    },
    {
      id: 'calendar-facilitator',
      isVisible: !isPast,
      variant: 'overflow',
      overflow: {
        id: 'cal',
        label: isDownloadingCalendar ? 'Downloading calendar file...' : 'Download calendar file',
        onAction: onDownloadCalendar,
      },
    },
  ];
};
