import { CTALinkOrButton, OverflowMenu } from '@bluedot/ui';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { useState } from 'react';
import { IoBan, IoCheckmark } from 'react-icons/io5';
import { downloadDiscussionCalendarFile } from '../../lib/downloadCalendarFile';
import { formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';

type DiscussionStatus = 'upcoming' | 'live' | 'attended' | 'absent';

type DiscussionListRowProps = {
  discussion: GroupDiscussion;
  unit: Unit | null;
  status: DiscussionStatus;
  onReschedule: () => void;
};

const DiscussionListRow = ({
  discussion, unit, status, onReschedule,
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

  const date = formatDateMonthAndDay(discussion.startDateTime);
  const time = formatTime12HourClock(discussion.startDateTime);
  const unitNumber = unit?.unitNumber ?? discussion.unitNumber;
  const unitLabel = unitNumber !== null ? `UNIT ${unitNumber}` : 'UNIT';
  const title = unit?.title ?? 'Discussion';
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const joinHref = discussion.zoomLink || undefined;

  const calendarItem = {
    id: 'cal',
    label: isDownloading ? 'Downloading…' : 'Download calendar file',
    onAction: handleDownloadCalendar,
  };

  return (
    <li className="flex items-center gap-5 py-4 not-last:border-b not-last:border-color-divider">
      <div
        aria-hidden
        className="flex shrink-0 flex-col items-center justify-center rounded border border-color-divider px-3 py-[7px] text-bluedot-navy"
      >
        <span className="text-size-xs font-semibold">{date}</span>
        <span className="text-size-xxs font-medium text-gray-500">{time}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-size-xxs font-semibold text-bluedot-black">{unitLabel}</p>
        <p className="mt-px text-size-sm font-semibold text-bluedot-navy">{title}</p>
        {downloadError && (
          <p className="mt-1 text-size-xxs text-red-600" role="alert" aria-live="polite">{downloadError}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {status === 'upcoming' && (
          <>
            <CTALinkOrButton variant="secondary" size="small" onClick={onReschedule}>Reschedule</CTALinkOrButton>
            <OverflowMenu ariaLabel="Discussion actions" items={[calendarItem]} />
          </>
        )}
        {status === 'live' && (
          <>
            <CTALinkOrButton variant="secondary" size="small" onClick={onReschedule}>Reschedule</CTALinkOrButton>
            {joinHref && (
              <CTALinkOrButton variant="primary" size="small" url={joinHref} target="_blank">Join now</CTALinkOrButton>
            )}
            <OverflowMenu ariaLabel="Discussion actions" items={[calendarItem]} />
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
            <CTALinkOrButton variant="primary" size="small" onClick={onReschedule}>Reschedule</CTALinkOrButton>
          </>
        )}
      </div>
    </li>
  );
};

export default DiscussionListRow;
