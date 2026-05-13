import { CTALinkOrButton, OverflowMenu, type OverflowMenuItemProps } from '@bluedot/ui';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { Fragment, useState, type ReactNode } from 'react';
import { IoBan, IoCheckmark } from 'react-icons/io5';
import { downloadDiscussionCalendarFile } from '../../lib/downloadCalendarFile';
import TimeWidget from './TimeWidget';

type DiscussionStatus = 'upcoming' | 'soon' | 'live' | 'attended' | 'absent';

type DiscussionListRowProps = {
  discussion: GroupDiscussion;
  unit: Unit | null;
  courseSlug: string;
  status: DiscussionStatus;
  canReschedule: boolean;
  onReschedule: () => void;
};

const DiscussionListRow = ({
  discussion, unit, courseSlug, status, canReschedule, onReschedule,
}: DiscussionListRowProps) => {
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

  // All row actions declared once. `variant` decides where they surface:
  //   inline   — desktop inline button or pill. Folded into the mobile overflow menu.
  //   overflow — always in the overflow menu (both viewports).
  // The renderer derives `desktopOverflow` and `mobileOverflow` from this single table so
  // an action can never accidentally appear in both inline + overflow on the same viewport.
  type DiscussionAction = {
    id: string;
    isVisible: boolean;
    variant: 'inline' | 'overflow';
    inline?: ReactNode;
    overflow: OverflowMenuItemProps;
  };

  const actions: DiscussionAction[] = [
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
      // Pills have no overflow representation but the type requires `overflow`; render a no-op
      // entry that's never used because we filter pills out of overflow construction below.
      overflow: { id: 'attended-pill-noop', label: 'Attended' },
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
      overflow: { id: 'absent-pill-noop', label: 'Absent' },
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

  // Pill ids whose overflow representation is intentionally a no-op (purely visual).
  const PILL_IDS = new Set(['attended-pill', 'absent-pill']);

  const visible = actions.filter((a) => a.isVisible);
  const inlineActions = visible.filter((a) => a.variant === 'inline');
  const desktopOverflowItems = visible
    .filter((a) => a.variant === 'overflow')
    .map((a) => a.overflow);
  const mobileOverflowItems = visible
    .filter((a) => !PILL_IDS.has(a.id))
    .map((a) => a.overflow);

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

export default DiscussionListRow;
