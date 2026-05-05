import { CTALinkOrButton, OverflowMenu } from '@bluedot/ui';
import { IoBan, IoCheckmark } from 'react-icons/io5';

type DiscussionStatus = 'upcoming' | 'live' | 'attended' | 'absent';

type DiscussionListRowProps = {
  date: string;
  time: string;
  unit: string;
  title: string;
  status: DiscussionStatus;
  onReschedule?: () => void;
  joinHref?: string;
  onDownloadCalendar?: () => void;
};

const DiscussionListRow = ({
  date, time, unit, title, status, onReschedule, joinHref, onDownloadCalendar,
}: DiscussionListRowProps) => (
  <li className="flex items-center gap-5 px-6 pt-4 pb-4 not-last:border-b not-last:border-color-divider">
    <div
      aria-hidden
      className="flex shrink-0 flex-col items-center justify-center rounded border border-color-divider px-3 py-[7px] text-bluedot-navy"
    >
      <span className="text-size-xs font-semibold">{date}</span>
      <span className="text-size-xxs font-medium text-gray-500">{time}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-size-xxs font-semibold text-bluedot-black">{unit}</p>
      <p className="text-size-sm font-semibold text-bluedot-navy">{title}</p>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      {status === 'upcoming' && (
        <>
          <CTALinkOrButton variant="secondary" size="small" onClick={onReschedule}>Reschedule</CTALinkOrButton>
          <OverflowMenu
            ariaLabel="Discussion actions"
            items={[{ id: 'cal', label: 'Download calendar file', onAction: onDownloadCalendar ?? (() => {}) }]}
          />
        </>
      )}
      {status === 'live' && (
        <>
          <CTALinkOrButton variant="secondary" size="small" onClick={onReschedule}>Reschedule</CTALinkOrButton>
          <CTALinkOrButton variant="primary" size="small" url={joinHref} target="_blank">Join now</CTALinkOrButton>
          <OverflowMenu
            ariaLabel="Discussion actions"
            items={[{ id: 'cal', label: 'Download calendar file', onAction: onDownloadCalendar ?? (() => {}) }]}
          />
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

export default DiscussionListRow;
