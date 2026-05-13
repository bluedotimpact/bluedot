import {
  CTALinkOrButton, OverflowMenu, useCurrentTimeMs, type OverflowMenuItemProps,
} from '@bluedot/ui';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { Fragment, useState, type ReactNode } from 'react';
import { IoBan, IoCheckmark } from 'react-icons/io5';
import { downloadDiscussionCalendarFile } from '../../lib/downloadCalendarFile';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import { formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';

type DiscussionStatus = 'upcoming' | 'soon' | 'live' | 'attended' | 'absent';

/**
 * One row-level action. `variant` decides where it surfaces:
 * - inline: desktop inline button or pill. Folded into the mobile overflow menu.
 * - overflow: overflow menu only.
 * Pills (visual-only) just omit `overflow`.
 */
export type CourseAction = {
  id: string;
  isVisible: boolean;
  variant: 'inline' | 'overflow';
  inline?: ReactNode;
  overflow?: OverflowMenuItemProps;
};

type DiscussionListRowProps = {
  discussion: GroupDiscussion;
  unit: Unit | null;
  courseSlug: string;
  isAttended: boolean;
  canReschedule: boolean;
  onReschedule: () => void;
};

const DiscussionListRow = ({
  discussion, unit, courseSlug, isAttended, canReschedule, onReschedule,
}: DiscussionListRowProps) => {
  const currentTimeMs = useCurrentTimeMs();
  const timeState = getDiscussionTimeState({ discussion, currentTimeMs });

  // Live wins over attended: suppress the Attended pill while a discussion is in progress so
  // users can't read off "you're counted as attended" the moment they click Join.
  let status: DiscussionStatus;
  if (timeState === 'live') status = 'live';
  else if (isAttended) status = 'attended';
  else if (timeState === 'soon') status = 'soon';
  else if (timeState === 'ended') status = 'absent';
  else status = 'upcoming';

  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloadingCalendar, setIsDownloading] = useState(false);

  const handleDownloadCalendarFile = async () => {
    if (isDownloadingCalendar) return;
    try {
      setDownloadError(null);
      setIsDownloading(true);
      await downloadDiscussionCalendarFile(discussion.id);
    } catch {
      setDownloadError('Could not download the calendar file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const unitNumber = unit?.unitNumber ?? discussion.unitNumber;
  const unitLabel = unitNumber !== null ? `UNIT ${unitNumber}` : 'UNIT';
  const title = unit?.title ?? 'Discussion';
  const discussionPrepareLink = unitNumber !== null ? `/courses/${courseSlug}/${unitNumber}` : null;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const discussionMeetLink = discussion.zoomLink || undefined;

  const isPast = status === 'attended' || status === 'absent';
  const isFutureLike = status === 'upcoming' || status === 'soon' || status === 'live';

  const actions: CourseAction[] = [
    {
      id: 'reschedule-upcoming',
      isVisible: isFutureLike,
      variant: 'inline',
      inline: <CTALinkOrButton variant="secondary" size="small" onClick={onReschedule}>Reschedule</CTALinkOrButton>,
      overflow: { id: 'reschedule', label: 'Reschedule', onAction: onReschedule },
    },
    {
      id: 'join-now',
      isVisible: status === 'live' && Boolean(discussionMeetLink),
      variant: 'inline',
      inline: discussionMeetLink ? <CTALinkOrButton variant="primary" size="small" url={discussionMeetLink} target="_blank">Join now</CTALinkOrButton> : null,
      overflow: {
        id: 'join', label: 'Join now', href: discussionMeetLink ?? '', target: '_blank',
      },
    },
    {
      id: 'attended-pill',
      isVisible: status === 'attended',
      variant: 'inline',
      inline: (
        <span className="inline-flex h-9 items-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker">
          <IoCheckmark aria-hidden size={14} />
          Attended
        </span>
      ),
    },
    {
      id: 'absent-pill',
      isVisible: status === 'absent',
      variant: 'inline',
      inline: (
        <span className="inline-flex h-9 items-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker">
          <IoBan aria-hidden size={14} />
          Absent
        </span>
      ),
    },
    {
      id: 'reschedule-absent',
      isVisible: status === 'absent' && canReschedule,
      variant: 'inline',
      inline: <CTALinkOrButton variant="primary" size="small" onClick={onReschedule}>Reschedule</CTALinkOrButton>,
      overflow: { id: 'reschedule', label: 'Reschedule', onAction: onReschedule },
    },
    {
      id: 'calendar',
      isVisible: !isPast,
      variant: 'overflow',
      overflow: {
        id: 'cal',
        label: isDownloadingCalendar ? 'Downloading calendar file...' : 'Download calendar file',
        onAction: handleDownloadCalendarFile,
      },
    },
  ];

  const visible = actions.filter((a) => a.isVisible);
  const inlineActions = visible.filter((a) => a.variant === 'inline');
  const desktopOverflowItems = visible
    .filter((a) => a.variant === 'overflow' && a.overflow)
    .map((a) => a.overflow!);
  // Mobile folds inline actions into the overflow menu; pills (no overflow) drop out naturally.
  const mobileOverflowItems = visible
    .map((a) => a.overflow)
    .filter((o): o is OverflowMenuItemProps => !!o);

  return (
    <li className="flex items-center gap-5 py-4 not-last:border-b not-last:border-color-divider">
      <TimeWidget isLive={status === 'live'} dateTimeSeconds={discussion.startDateTime} />
      <div className="min-w-0 flex-1">
        <p className="text-size-xxs font-semibold text-bluedot-black">{unitLabel}</p>
        {discussionPrepareLink ? (
          <a
            href={discussionPrepareLink}
            className="block text-size-sm font-semibold leading-[24px] text-bluedot-black no-underline w-fit transition-colors hover:text-bluedot-normal hover:underline underline-offset-2"
          >
            {title}
          </a>
        ) : (
          <p className="text-size-sm font-semibold leading-[24px] text-bluedot-black">{title}</p>
        )}
        {downloadError && (
          <p className="mt-1 text-size-xxs text-red-600" role="alert" aria-live="polite">{downloadError}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {/* Desktop: inline buttons/pills + overflow menu containing only `overflow`-variant items. */}
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {inlineActions.map((a) => <Fragment key={a.id}>{a.inline}</Fragment>)}
          {desktopOverflowItems.length > 0 && (
            <OverflowMenu ariaLabel="Discussion actions" items={desktopOverflowItems} />
          )}
        </div>
        {/* Mobile: only the overflow menu, but it contains every action (inline buttons fold in). */}
        <div className="sm:hidden">
          {mobileOverflowItems.length > 0 && (
            <OverflowMenu ariaLabel="Discussion actions" items={mobileOverflowItems} />
          )}
        </div>
      </div>
    </li>
  );
};

const TimeWidget = ({ isLive, dateTimeSeconds }: { isLive: boolean; dateTimeSeconds: number }) => (
  <div className="flex shrink-0 min-w-[85px] flex-col items-stretch overflow-hidden rounded-[5px] border border-color-divider">
    {isLive ? (
      <>
        <div className="px-3 py-1 text-center text-size-xs font-bold leading-[22px] text-bluedot-navy">NOW</div>
        <div className="bg-bluedot-normal py-[3px] text-center text-size-xxs font-semibold leading-[16px] text-white">LIVE</div>
      </>
    ) : (
      <div className="px-3 py-[7px] text-center text-bluedot-navy" aria-hidden>
        <div className="text-size-xs font-semibold leading-[22px]">{formatDateMonthAndDay(dateTimeSeconds)}</div>
        <div className="text-size-xxs font-medium leading-[16px] text-gray-500">{formatTime12HourClock(dateTimeSeconds)}</div>
      </div>
    )}
  </div>
);

export default DiscussionListRow;
