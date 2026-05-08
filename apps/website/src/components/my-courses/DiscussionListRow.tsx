import { CTALinkOrButton, OverflowMenu, type OverflowMenuItemProps } from '@bluedot/ui';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { useState } from 'react';
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
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCalendar = async () => {
    if (isDownloading) return;
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
  const prepareUrl = unitNumber !== null ? `/courses/${courseSlug}/${unitNumber}` : null;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const joinHref = discussion.zoomLink || undefined;

  const calendarItem = {
    id: 'cal',
    label: isDownloading ? 'Downloading…' : 'Download calendar file',
    onAction: handleDownloadCalendar,
  };

  // Match design: Join now appears only on the live row. The soon window keeps the standard
  // upcoming-style row (Reschedule + overflow), matching the NextDiscussionCard which also
  // only flips its primary CTA to Join discussion on live.
  const showJoinNow = status === 'live';
  const showSchedulingActions = status === 'upcoming' || status === 'soon' || status === 'live';
  const showRescheduleForAbsent = status === 'absent' && canReschedule;

  const overflowItems: OverflowMenuItemProps[] = [];
  if (showSchedulingActions || showRescheduleForAbsent) {
    overflowItems.push({ id: 'reschedule', label: 'Reschedule', onAction: onReschedule });
  }

  if (showJoinNow && joinHref) {
    overflowItems.push({
      id: 'join', label: 'Join now', href: joinHref, target: '_blank',
    });
  }

  overflowItems.push(calendarItem);

  return (
    <li className="flex items-center gap-5 py-4 not-last:border-b not-last:border-color-divider">
      <TimeWidget isLive={status === 'live'} dateTimeSeconds={discussion.startDateTime} />
      <div className="min-w-0 flex-1">
        <p className="text-size-xxs font-semibold text-bluedot-black">{unitLabel}</p>
        {prepareUrl ? (
          <a
            href={prepareUrl}
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
        {/* Inline actions/pills hidden on mobile per design — everything reachable via the overflow menu instead. */}
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {showSchedulingActions && (
            <>
              <CTALinkOrButton variant="secondary" size="small" onClick={onReschedule}>Reschedule</CTALinkOrButton>
              {showJoinNow && joinHref && (
                <CTALinkOrButton variant="primary" size="small" url={joinHref} target="_blank">Join now</CTALinkOrButton>
              )}
            </>
          )}
          {status === 'attended' && (
            <span className="inline-flex h-9 items-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker">
              <IoCheckmark aria-hidden size={14} />
              Attended
            </span>
          )}
          {status === 'absent' && (
            <>
              <span className="inline-flex h-9 items-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker">
                <IoBan aria-hidden size={14} />
                Absent
              </span>
              {canReschedule && (
                <CTALinkOrButton variant="primary" size="small" onClick={onReschedule}>Reschedule</CTALinkOrButton>
              )}
            </>
          )}
        </div>
        <OverflowMenu ariaLabel="Discussion actions" items={overflowItems} />
      </div>
    </li>
  );
};

export default DiscussionListRow;
